// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MezoLPToken
 * @dev LP token minted to liquidity providers
 */
contract MezoLPToken is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

/**
 * @title MezoLiquidity
 * @dev AMM liquidity pool manager for Mezo - supports multiple 50/50 pools
 *      with LP tokens, staking rewards (MATS), and fee distribution
 */
contract MezoLiquidity is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Pool {
        address tokenA;
        address tokenB;
        MezoLPToken lpToken;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalFees;
        uint256 swapFeeRate;   // Basis points (e.g., 30 = 0.30%)
        uint256 apr;           // Display APR in basis points
        bool isActive;
        string name;
    }

    struct LPPosition {
        uint256 lpAmount;
        uint256 depositedA;
        uint256 depositedB;
        uint256 depositTimestamp;
    }

    // Reward token (MATS)
    IERC20 public rewardToken;
    uint256 public rewardRate;
    uint256 public periodFinish;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    // Pools
    uint256 public poolCount;
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => LPPosition)) public positions;
    mapping(uint256 => mapping(address => uint256)) public userRewardPerTokenPaid;
    mapping(uint256 => mapping(address => uint256)) public rewards;

    // Stats
    uint256 public totalValueLocked;

    // Events
    event PoolCreated(uint256 indexed poolId, string name, address tokenA, address tokenB, address lpToken);
    event LiquidityAdded(uint256 indexed poolId, address indexed provider, uint256 amountA, uint256 amountB, uint256 lpMinted);
    event LiquidityRemoved(uint256 indexed poolId, address indexed provider, uint256 amountA, uint256 amountB, uint256 lpBurned);
    event Swap(uint256 indexed poolId, address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut, uint256 fee);
    event RewardClaimed(uint256 indexed poolId, address indexed user, uint256 reward);
    event RewardAdded(uint256 reward, uint256 duration);

    constructor(address _rewardToken) Ownable(msg.sender) {
        rewardToken = IERC20(_rewardToken);
        lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Create a new liquidity pool
     */
    function createPool(
        string calldata name,
        address tokenA,
        address tokenB,
        uint256 swapFeeRate,
        uint256 apr
    ) external onlyOwner returns (uint256) {
        require(tokenA != tokenB, "Identical tokens");

        uint256 poolId = poolCount++;

        // Deploy LP token
        string memory lpName = string(abi.encodePacked("sAMM-", name, " LP"));
        string memory lpSymbol = string(abi.encodePacked("sAMM-", name));
        MezoLPToken lpToken = new MezoLPToken(lpName, lpSymbol);

        pools[poolId] = Pool({
            tokenA: tokenA,
            tokenB: tokenB,
            lpToken: lpToken,
            reserveA: 0,
            reserveB: 0,
            totalFees: 0,
            swapFeeRate: swapFeeRate,
            apr: apr,
            isActive: true,
            name: name
        });

        emit PoolCreated(poolId, name, tokenA, tokenB, address(lpToken));
        return poolId;
    }

    /**
     * @dev Add liquidity to a pool (proportional deposit)
     */
    function addLiquidity(
        uint256 poolId,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant returns (uint256 lpMinted) {
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool not active");
        require(amountA > 0 && amountB > 0, "Zero amounts");

        IERC20(pool.tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(pool.tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        // Calculate LP tokens to mint
        if (pool.reserveA == 0 && pool.reserveB == 0) {
            // Initial liquidity - use geometric mean
            lpMinted = sqrt(amountA * amountB);
        } else {
            // Proportional
            uint256 lpA = (amountA * pool.lpToken.totalSupply()) / pool.reserveA;
            uint256 lpB = (amountB * pool.lpToken.totalSupply()) / pool.reserveB;
            lpMinted = lpA < lpB ? lpA : lpB;
        }

        require(lpMinted > 0, "Insufficient liquidity minted");

        pool.reserveA += amountA;
        pool.reserveB += amountB;

        LPPosition storage pos = positions[poolId][msg.sender];
        pos.lpAmount += lpMinted;
        pos.depositedA += amountA;
        pos.depositedB += amountB;
        pos.depositTimestamp = block.timestamp;

        pool.lpToken.mint(msg.sender, lpMinted);

        emit LiquidityAdded(poolId, msg.sender, amountA, amountB, lpMinted);
    }

    /**
     * @dev Remove liquidity from a pool by percentage
     */
    function removeLiquidity(
        uint256 poolId,
        uint256 percentage // Basis points: 10000 = 100%
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(percentage > 0 && percentage <= 10000, "Invalid percentage");

        Pool storage pool = pools[poolId];
        LPPosition storage pos = positions[poolId][msg.sender];
        require(pos.lpAmount > 0, "No position");

        uint256 lpToBurn = (pos.lpAmount * percentage) / 10000;
        uint256 totalLP = pool.lpToken.totalSupply();

        // Calculate proportional share
        amountA = (pool.reserveA * lpToBurn) / totalLP;
        amountB = (pool.reserveB * lpToBurn) / totalLP;

        pool.reserveA -= amountA;
        pool.reserveB -= amountB;
        pos.lpAmount -= lpToBurn;

        pool.lpToken.burn(msg.sender, lpToBurn);

        IERC20(pool.tokenA).safeTransfer(msg.sender, amountA);
        IERC20(pool.tokenB).safeTransfer(msg.sender, amountB);

        emit LiquidityRemoved(poolId, msg.sender, amountA, amountB, lpToBurn);
    }

    /**
     * @dev Swap tokens within a pool
     */
    function swap(
        uint256 poolId,
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool not active");
        require(tokenIn == pool.tokenA || tokenIn == pool.tokenB, "Invalid token");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        bool isTokenA = tokenIn == pool.tokenA;
        (uint256 reserveIn, uint256 reserveOut) = isTokenA
            ? (pool.reserveA, pool.reserveB)
            : (pool.reserveB, pool.reserveA);

        // Fee
        uint256 fee = (amountIn * pool.swapFeeRate) / 10000;
        uint256 netIn = amountIn - fee;

        // Constant product
        amountOut = (reserveOut * netIn) / (reserveIn + netIn);
        require(amountOut >= minAmountOut, "Slippage exceeded");

        // Update reserves
        if (isTokenA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }
        pool.totalFees += fee;

        address tokenOut = isTokenA ? pool.tokenB : pool.tokenA;
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        emit Swap(poolId, msg.sender, tokenIn, amountIn, amountOut, fee);
    }

    /**
     * @dev Claim MATS rewards for a pool position
     */
    function claimRewards(uint256 poolId) external nonReentrant {
        uint256 reward = rewards[poolId][msg.sender];
        require(reward > 0, "No rewards");

        rewards[poolId][msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, reward);

        emit RewardClaimed(poolId, msg.sender, reward);
    }

    /**
     * @dev Get pool info
     */
    function getPool(uint256 poolId) external view returns (
        string memory name,
        address tokenA,
        address tokenB,
        uint256 reserveA,
        uint256 reserveB,
        uint256 totalFees,
        uint256 apr,
        address lpToken,
        bool isActive
    ) {
        Pool memory p = pools[poolId];
        return (p.name, p.tokenA, p.tokenB, p.reserveA, p.reserveB, p.totalFees, p.apr, address(p.lpToken), p.isActive);
    }

    /**
     * @dev Get user position in a pool
     */
    function getPosition(uint256 poolId, address user) external view returns (
        uint256 lpAmount,
        uint256 depositedA,
        uint256 depositedB,
        uint256 shareOfPool // Basis points
    ) {
        LPPosition memory pos = positions[poolId][user];
        Pool memory pool = pools[poolId];
        uint256 totalLP = pool.lpToken.totalSupply();
        uint256 share = totalLP > 0 ? (pos.lpAmount * 10000) / totalLP : 0;
        return (pos.lpAmount, pos.depositedA, pos.depositedB, share);
    }

    /**
     * @dev Get expected output for a swap
     */
    function getAmountOut(uint256 poolId, address tokenIn, uint256 amountIn) external view returns (uint256) {
        Pool memory pool = pools[poolId];
        bool isTokenA = tokenIn == pool.tokenA;
        (uint256 reserveIn, uint256 reserveOut) = isTokenA
            ? (pool.reserveA, pool.reserveB)
            : (pool.reserveB, pool.reserveA);

        uint256 fee = (amountIn * pool.swapFeeRate) / 10000;
        uint256 netIn = amountIn - fee;
        return (reserveOut * netIn) / (reserveIn + netIn);
    }

    // Admin

    function setPoolActive(uint256 poolId, bool active) external onlyOwner {
        pools[poolId].isActive = active;
    }

    function setSwapFee(uint256 poolId, uint256 fee) external onlyOwner {
        require(fee <= 1000, "Max 10%");
        pools[poolId].swapFeeRate = fee;
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    // Math helper
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}
