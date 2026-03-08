// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MezoStakingRewards
 * @dev Aave-style staking with slashing, cooldown periods, and reward distribution
 *      Supports multiple staking pools (BTC, MUSD, MEZO)
 */
contract MezoStakingRewards is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct StakingPool {
        IERC20 stakingToken;
        IERC20 rewardToken;
        uint256 totalStaked;
        uint256 rewardRate;           // Rewards per second
        uint256 rewardPerTokenStored;
        uint256 lastUpdateTime;
        uint256 periodFinish;
        uint256 cooldownPeriod;       // Seconds before unstake
        uint256 unstakeWindow;        // Seconds to unstake after cooldown
        uint256 slashingRate;         // Basis points (e.g., 3000 = 30%)
        bool isActive;
        string name;
    }

    struct UserStake {
        uint256 amount;
        uint256 rewardPerTokenPaid;
        uint256 rewards;
        uint256 cooldownTimestamp;
        uint256 stakedAt;
    }

    uint256 public poolCount;
    mapping(uint256 => StakingPool) public pools;
    mapping(uint256 => mapping(address => UserStake)) public userStakes;

    // Slashing
    address public slashingAdmin;
    uint256 public constant MAX_SLASH_RATE = 3000; // 30% max

    // Events
    event PoolCreated(uint256 indexed poolId, string name, address stakingToken, address rewardToken);
    event Staked(uint256 indexed poolId, address indexed user, uint256 amount);
    event Unstaked(uint256 indexed poolId, address indexed user, uint256 amount);
    event RewardClaimed(uint256 indexed poolId, address indexed user, uint256 reward);
    event CooldownActivated(uint256 indexed poolId, address indexed user, uint256 timestamp);
    event Slashed(uint256 indexed poolId, uint256 amount, address destination);
    event RewardAdded(uint256 indexed poolId, uint256 reward, uint256 duration);

    constructor() Ownable(msg.sender) {
        slashingAdmin = msg.sender;
    }

    modifier updateReward(uint256 poolId, address account) {
        StakingPool storage pool = pools[poolId];
        pool.rewardPerTokenStored = rewardPerToken(poolId);
        pool.lastUpdateTime = lastTimeRewardApplicable(poolId);

        if (account != address(0)) {
            UserStake storage stake = userStakes[poolId][account];
            stake.rewards = earned(poolId, account);
            stake.rewardPerTokenPaid = pool.rewardPerTokenStored;
        }
        _;
    }

    /**
     * @dev Create a new staking pool
     */
    function createPool(
        string calldata name,
        address stakingToken,
        address rewardToken,
        uint256 cooldownPeriod,
        uint256 unstakeWindow,
        uint256 slashingRate
    ) external onlyOwner returns (uint256) {
        require(slashingRate <= MAX_SLASH_RATE, "Slash rate too high");

        uint256 poolId = poolCount++;

        pools[poolId] = StakingPool({
            stakingToken: IERC20(stakingToken),
            rewardToken: IERC20(rewardToken),
            totalStaked: 0,
            rewardRate: 0,
            rewardPerTokenStored: 0,
            lastUpdateTime: block.timestamp,
            periodFinish: block.timestamp,
            cooldownPeriod: cooldownPeriod,
            unstakeWindow: unstakeWindow,
            slashingRate: slashingRate,
            isActive: true,
            name: name
        });

        emit PoolCreated(poolId, name, stakingToken, rewardToken);
        return poolId;
    }

    /**
     * @dev Stake tokens into a pool
     */
    function stake(uint256 poolId, uint256 amount) external nonReentrant updateReward(poolId, msg.sender) {
        require(amount > 0, "Cannot stake 0");
        StakingPool storage pool = pools[poolId];
        require(pool.isActive, "Pool not active");

        pool.stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        UserStake storage userStake = userStakes[poolId][msg.sender];
        userStake.amount += amount;
        userStake.stakedAt = block.timestamp;
        pool.totalStaked += amount;

        emit Staked(poolId, msg.sender, amount);
    }

    /**
     * @dev Activate cooldown period before unstaking
     */
    function cooldown(uint256 poolId) external {
        UserStake storage userStake = userStakes[poolId][msg.sender];
        require(userStake.amount > 0, "Nothing staked");

        userStake.cooldownTimestamp = block.timestamp;
        emit CooldownActivated(poolId, msg.sender, block.timestamp);
    }

    /**
     * @dev Unstake tokens after cooldown window
     */
    function unstake(uint256 poolId, uint256 amount) external nonReentrant updateReward(poolId, msg.sender) {
        UserStake storage userStake = userStakes[poolId][msg.sender];
        require(amount > 0 && amount <= userStake.amount, "Invalid amount");

        StakingPool storage pool = pools[poolId];

        if (pool.cooldownPeriod > 0) {
            require(userStake.cooldownTimestamp > 0, "Cooldown not activated");
            uint256 cooldownEnd = userStake.cooldownTimestamp + pool.cooldownPeriod;
            require(block.timestamp >= cooldownEnd, "Cooldown not finished");
            require(block.timestamp <= cooldownEnd + pool.unstakeWindow, "Unstake window closed");
        }

        userStake.amount -= amount;
        pool.totalStaked -= amount;

        if (userStake.amount == 0) {
            userStake.cooldownTimestamp = 0;
        }

        pool.stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(poolId, msg.sender, amount);
    }

    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards(uint256 poolId) external nonReentrant updateReward(poolId, msg.sender) {
        UserStake storage userStake = userStakes[poolId][msg.sender];
        uint256 reward = userStake.rewards;
        require(reward > 0, "No rewards");

        userStake.rewards = 0;
        pools[poolId].rewardToken.safeTransfer(msg.sender, reward);

        emit RewardClaimed(poolId, msg.sender, reward);
    }

    /**
     * @dev Slash staked funds in case of shortfall event
     */
    function slash(uint256 poolId, address destination) external {
        require(msg.sender == slashingAdmin, "Not slashing admin");
        StakingPool storage pool = pools[poolId];

        uint256 slashAmount = (pool.totalStaked * pool.slashingRate) / 10000;
        pool.totalStaked -= slashAmount;
        pool.stakingToken.safeTransfer(destination, slashAmount);

        emit Slashed(poolId, slashAmount, destination);
    }

    /**
     * @dev Add rewards to a pool
     */
    function notifyRewardAmount(uint256 poolId, uint256 reward, uint256 duration)
        external
        onlyOwner
        updateReward(poolId, address(0))
    {
        StakingPool storage pool = pools[poolId];
        pool.rewardToken.safeTransferFrom(msg.sender, address(this), reward);

        if (block.timestamp >= pool.periodFinish) {
            pool.rewardRate = reward / duration;
        } else {
            uint256 remaining = pool.periodFinish - block.timestamp;
            uint256 leftover = remaining * pool.rewardRate;
            pool.rewardRate = (reward + leftover) / duration;
        }

        pool.lastUpdateTime = block.timestamp;
        pool.periodFinish = block.timestamp + duration;

        emit RewardAdded(poolId, reward, duration);
    }

    // View functions

    function rewardPerToken(uint256 poolId) public view returns (uint256) {
        StakingPool storage pool = pools[poolId];
        if (pool.totalStaked == 0) return pool.rewardPerTokenStored;

        return pool.rewardPerTokenStored +
            ((lastTimeRewardApplicable(poolId) - pool.lastUpdateTime) * pool.rewardRate * 1e18) /
            pool.totalStaked;
    }

    function earned(uint256 poolId, address account) public view returns (uint256) {
        UserStake storage userStake = userStakes[poolId][account];
        return (userStake.amount * (rewardPerToken(poolId) - userStake.rewardPerTokenPaid)) / 1e18 + userStake.rewards;
    }

    function lastTimeRewardApplicable(uint256 poolId) public view returns (uint256) {
        return block.timestamp < pools[poolId].periodFinish ? block.timestamp : pools[poolId].periodFinish;
    }

    function getUserStake(uint256 poolId, address user) external view returns (
        uint256 amount,
        uint256 rewards,
        uint256 cooldownTimestamp,
        uint256 stakedAt
    ) {
        UserStake memory s = userStakes[poolId][user];
        return (s.amount, earned(poolId, user), s.cooldownTimestamp, s.stakedAt);
    }

    // Admin

    function setSlashingAdmin(address _admin) external onlyOwner {
        slashingAdmin = _admin;
    }

    function setPoolActive(uint256 poolId, bool active) external onlyOwner {
        pools[poolId].isActive = active;
    }
}
