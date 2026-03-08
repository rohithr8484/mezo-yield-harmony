// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title MezoLocks
 * @dev veBTC-style lock contract for Mezo - lock BTC to earn yield and voting power
 *      Each lock position is represented as an NFT for composability
 */
contract MezoLocks is ERC721, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

    IERC20 public btcToken;     // tBTC on Mezo
    IERC20 public rewardToken;  // MEZO or MUSD rewards

    Counters.Counter private _lockIds;

    // Lock duration tiers
    uint256 public constant MIN_LOCK = 7 days;
    uint256 public constant MAX_LOCK = 365 days;
    uint256 public constant BOOST_PRECISION = 10000;

    struct LockPosition {
        uint256 id;
        address owner;
        uint256 amount;
        uint256 lockStart;
        uint256 lockEnd;
        uint256 boostMultiplier;   // Basis points (10000 = 1x, 40000 = 4x)
        uint256 rewardDebt;
        bool withdrawn;
    }

    struct LockTier {
        uint256 duration;
        uint256 boostMultiplier;
        string name;
    }

    // Global reward state
    uint256 public accRewardPerShare;
    uint256 public lastRewardTime;
    uint256 public rewardRate;
    uint256 public periodFinish;
    uint256 public totalBoostedStake;

    // Lock tiers
    LockTier[] public lockTiers;

    // State
    mapping(uint256 => LockPosition) public locks;
    mapping(address => uint256[]) public userLocks;

    // Stats
    uint256 public totalLocked;
    uint256 public totalLockers;

    // Events
    event Locked(uint256 indexed lockId, address indexed user, uint256 amount, uint256 duration, uint256 boost);
    event Unlocked(uint256 indexed lockId, address indexed user, uint256 amount);
    event Extended(uint256 indexed lockId, uint256 newLockEnd, uint256 newBoost);
    event IncreasedAmount(uint256 indexed lockId, uint256 addedAmount);
    event RewardClaimed(uint256 indexed lockId, address indexed user, uint256 reward);
    event RewardAdded(uint256 reward, uint256 duration);

    constructor(
        address _btcToken,
        address _rewardToken
    ) ERC721("Mezo Lock Position", "veBTC") Ownable(msg.sender) {
        btcToken = IERC20(_btcToken);
        rewardToken = IERC20(_rewardToken);
        lastRewardTime = block.timestamp;

        // Initialize lock tiers
        lockTiers.push(LockTier({ duration: 7 days,   boostMultiplier: 10000, name: "1 Week" }));
        lockTiers.push(LockTier({ duration: 30 days,  boostMultiplier: 12500, name: "1 Month" }));
        lockTiers.push(LockTier({ duration: 90 days,  boostMultiplier: 17500, name: "3 Months" }));
        lockTiers.push(LockTier({ duration: 180 days, boostMultiplier: 25000, name: "6 Months" }));
        lockTiers.push(LockTier({ duration: 365 days, boostMultiplier: 40000, name: "1 Year" }));
    }

    modifier updateRewards() {
        if (totalBoostedStake > 0 && block.timestamp > lastRewardTime) {
            uint256 endTime = block.timestamp < periodFinish ? block.timestamp : periodFinish;
            if (endTime > lastRewardTime) {
                uint256 elapsed = endTime - lastRewardTime;
                accRewardPerShare += (elapsed * rewardRate * 1e18) / totalBoostedStake;
            }
        }
        lastRewardTime = block.timestamp;
        _;
    }

    /**
     * @dev Lock BTC for a specified duration
     */
    function lock(uint256 amount, uint256 tierIndex) external nonReentrant updateRewards {
        require(amount > 0, "Cannot lock 0");
        require(tierIndex < lockTiers.length, "Invalid tier");

        LockTier memory tier = lockTiers[tierIndex];

        btcToken.safeTransferFrom(msg.sender, address(this), amount);

        _lockIds.increment();
        uint256 lockId = _lockIds.current();

        uint256 boostedAmount = (amount * tier.boostMultiplier) / BOOST_PRECISION;

        locks[lockId] = LockPosition({
            id: lockId,
            owner: msg.sender,
            amount: amount,
            lockStart: block.timestamp,
            lockEnd: block.timestamp + tier.duration,
            boostMultiplier: tier.boostMultiplier,
            rewardDebt: (boostedAmount * accRewardPerShare) / 1e18,
            withdrawn: false
        });

        userLocks[msg.sender].push(lockId);
        totalLocked += amount;
        totalBoostedStake += boostedAmount;
        totalLockers++;

        _safeMint(msg.sender, lockId);

        emit Locked(lockId, msg.sender, amount, tier.duration, tier.boostMultiplier);
    }

    /**
     * @dev Unlock BTC after lock period expires
     */
    function unlock(uint256 lockId) external nonReentrant updateRewards {
        LockPosition storage pos = locks[lockId];
        require(ownerOf(lockId) == msg.sender, "Not lock owner");
        require(!pos.withdrawn, "Already withdrawn");
        require(block.timestamp >= pos.lockEnd, "Lock not expired");

        // Claim pending rewards first
        _claimReward(lockId);

        uint256 boostedAmount = (pos.amount * pos.boostMultiplier) / BOOST_PRECISION;
        totalBoostedStake -= boostedAmount;
        totalLocked -= pos.amount;
        totalLockers--;

        pos.withdrawn = true;

        _burn(lockId);
        btcToken.safeTransfer(msg.sender, pos.amount);

        emit Unlocked(lockId, msg.sender, pos.amount);
    }

    /**
     * @dev Extend lock duration to a higher tier
     */
    function extendLock(uint256 lockId, uint256 newTierIndex) external nonReentrant updateRewards {
        LockPosition storage pos = locks[lockId];
        require(ownerOf(lockId) == msg.sender, "Not lock owner");
        require(!pos.withdrawn, "Already withdrawn");
        require(newTierIndex < lockTiers.length, "Invalid tier");

        LockTier memory newTier = lockTiers[newTierIndex];
        uint256 newLockEnd = block.timestamp + newTier.duration;
        require(newLockEnd > pos.lockEnd, "Must extend duration");
        require(newTier.boostMultiplier > pos.boostMultiplier, "Must increase boost");

        // Claim pending rewards
        _claimReward(lockId);

        // Update boosted stake
        uint256 oldBoosted = (pos.amount * pos.boostMultiplier) / BOOST_PRECISION;
        uint256 newBoosted = (pos.amount * newTier.boostMultiplier) / BOOST_PRECISION;
        totalBoostedStake = totalBoostedStake - oldBoosted + newBoosted;

        pos.lockEnd = newLockEnd;
        pos.boostMultiplier = newTier.boostMultiplier;
        pos.rewardDebt = (newBoosted * accRewardPerShare) / 1e18;

        emit Extended(lockId, newLockEnd, newTier.boostMultiplier);
    }

    /**
     * @dev Increase locked amount without changing duration
     */
    function increaseAmount(uint256 lockId, uint256 additionalAmount) external nonReentrant updateRewards {
        LockPosition storage pos = locks[lockId];
        require(ownerOf(lockId) == msg.sender, "Not lock owner");
        require(!pos.withdrawn, "Already withdrawn");
        require(additionalAmount > 0, "Must add amount");

        _claimReward(lockId);

        btcToken.safeTransferFrom(msg.sender, address(this), additionalAmount);

        uint256 oldBoosted = (pos.amount * pos.boostMultiplier) / BOOST_PRECISION;
        pos.amount += additionalAmount;
        uint256 newBoosted = (pos.amount * pos.boostMultiplier) / BOOST_PRECISION;

        totalBoostedStake = totalBoostedStake - oldBoosted + newBoosted;
        totalLocked += additionalAmount;
        pos.rewardDebt = (newBoosted * accRewardPerShare) / 1e18;

        emit IncreasedAmount(lockId, additionalAmount);
    }

    /**
     * @dev Claim rewards for a lock position
     */
    function claimReward(uint256 lockId) external nonReentrant updateRewards {
        require(ownerOf(lockId) == msg.sender, "Not lock owner");
        _claimReward(lockId);
    }

    function _claimReward(uint256 lockId) internal {
        LockPosition storage pos = locks[lockId];
        uint256 boostedAmount = (pos.amount * pos.boostMultiplier) / BOOST_PRECISION;
        uint256 pending = (boostedAmount * accRewardPerShare) / 1e18 - pos.rewardDebt;

        if (pending > 0) {
            rewardToken.safeTransfer(pos.owner, pending);
            emit RewardClaimed(lockId, pos.owner, pending);
        }

        pos.rewardDebt = (boostedAmount * accRewardPerShare) / 1e18;
    }

    /**
     * @dev Add rewards (owner only)
     */
    function notifyRewardAmount(uint256 reward, uint256 duration) external onlyOwner updateRewards {
        rewardToken.safeTransferFrom(msg.sender, address(this), reward);

        if (block.timestamp >= periodFinish) {
            rewardRate = reward / duration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / duration;
        }

        periodFinish = block.timestamp + duration;
        emit RewardAdded(reward, duration);
    }

    // View functions

    function pendingReward(uint256 lockId) external view returns (uint256) {
        LockPosition memory pos = locks[lockId];
        uint256 currentAccReward = accRewardPerShare;

        if (totalBoostedStake > 0 && block.timestamp > lastRewardTime) {
            uint256 endTime = block.timestamp < periodFinish ? block.timestamp : periodFinish;
            if (endTime > lastRewardTime) {
                currentAccReward += ((endTime - lastRewardTime) * rewardRate * 1e18) / totalBoostedStake;
            }
        }

        uint256 boostedAmount = (pos.amount * pos.boostMultiplier) / BOOST_PRECISION;
        return (boostedAmount * currentAccReward) / 1e18 - pos.rewardDebt;
    }

    function getUserLocks(address user) external view returns (uint256[] memory) {
        return userLocks[user];
    }

    function getLockTiers() external view returns (LockTier[] memory) {
        return lockTiers;
    }

    function getVotingPower(address user) external view returns (uint256) {
        uint256[] memory ids = userLocks[user];
        uint256 power = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            LockPosition memory pos = locks[ids[i]];
            if (!pos.withdrawn) {
                power += (pos.amount * pos.boostMultiplier) / BOOST_PRECISION;
            }
        }
        return power;
    }
}
