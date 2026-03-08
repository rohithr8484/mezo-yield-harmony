// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title MezoBridge
 * @dev Token swap router for Tigris DEX on Mezo Mainnet
 *      Handles swaps between BTC, MUSD, mUSDC, mUSDT, and MEZO
 */
contract MezoBridge is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    Counters.Counter private _swapIds;

    // Supported tokens
    struct Token {
        address tokenAddress;
        string symbol;
        uint8 decimals;
        bool isActive;
        uint256 totalVolume;
    }

    struct SwapRecord {
        uint256 id;
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 fee;
        uint256 timestamp;
    }

    // Pool for swaps
    struct LiquidityPool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalFees;
        uint256 swapFee; // Basis points (e.g., 30 = 0.3%)
        bool isActive;
    }

    // State
    mapping(string => Token) public tokens;
    string[] public tokenSymbols;

    mapping(bytes32 => LiquidityPool) public pools;
    bytes32[] public poolKeys;

    mapping(uint256 => SwapRecord) public swaps;
    mapping(address => uint256[]) public userSwaps;

    // Protocol fee
    uint256 public protocolFeeRate = 5; // 0.05% protocol fee
    address public feeCollector;

    // Slippage
    uint256 public maxSlippage = 100; // 1% default max slippage

    // Events
    event TokenAdded(string symbol, address tokenAddress, uint8 decimals);
    event PoolCreated(bytes32 indexed poolKey, address tokenA, address tokenB, uint256 swapFee);
    event Swapped(
        uint256 indexed swapId,
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );
    event LiquidityAdded(bytes32 indexed poolKey, address indexed provider, uint256 amountA, uint256 amountB);
    event LiquidityRemoved(bytes32 indexed poolKey, address indexed provider, uint256 amountA, uint256 amountB);

    constructor(address _feeCollector) Ownable(msg.sender) {
        feeCollector = _feeCollector;
    }

    /**
     * @dev Register a supported token
     */
    function addToken(
        string calldata symbol,
        address tokenAddress,
        uint8 decimals
    ) external onlyOwner {
        tokens[symbol] = Token({
            tokenAddress: tokenAddress,
            symbol: symbol,
            decimals: decimals,
            isActive: true,
            totalVolume: 0
        });
        tokenSymbols.push(symbol);

        emit TokenAdded(symbol, tokenAddress, decimals);
    }

    /**
     * @dev Create a liquidity pool for a token pair
     */
    function createPool(
        address tokenA,
        address tokenB,
        uint256 swapFee
    ) external onlyOwner returns (bytes32) {
        require(tokenA != tokenB, "Identical tokens");
        require(swapFee <= 1000, "Fee too high"); // Max 10%

        bytes32 poolKey = getPoolKey(tokenA, tokenB);
        require(!pools[poolKey].isActive, "Pool exists");

        pools[poolKey] = LiquidityPool({
            tokenA: tokenA,
            tokenB: tokenB,
            reserveA: 0,
            reserveB: 0,
            totalFees: 0,
            swapFee: swapFee,
            isActive: true
        });
        poolKeys.push(poolKey);

        emit PoolCreated(poolKey, tokenA, tokenB, swapFee);
        return poolKey;
    }

    /**
     * @dev Add liquidity to a pool
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant {
        bytes32 poolKey = getPoolKey(tokenA, tokenB);
        LiquidityPool storage pool = pools[poolKey];
        require(pool.isActive, "Pool not active");

        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        // Ensure correct ordering
        if (pool.tokenA == tokenA) {
            pool.reserveA += amountA;
            pool.reserveB += amountB;
        } else {
            pool.reserveA += amountB;
            pool.reserveB += amountA;
        }

        emit LiquidityAdded(poolKey, msg.sender, amountA, amountB);
    }

    /**
     * @dev Swap tokens using constant product formula (x * y = k)
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Zero amount");
        require(tokenIn != tokenOut, "Same token");

        bytes32 poolKey = getPoolKey(tokenIn, tokenOut);
        LiquidityPool storage pool = pools[poolKey];
        require(pool.isActive, "Pool not active");

        // Transfer input tokens
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Calculate swap
        (uint256 reserveIn, uint256 reserveOut) = pool.tokenA == tokenIn
            ? (pool.reserveA, pool.reserveB)
            : (pool.reserveB, pool.reserveA);

        // Fee deduction
        uint256 fee = (amountIn * pool.swapFee) / 10000;
        uint256 amountInAfterFee = amountIn - fee;

        // Constant product: amountOut = (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee)
        amountOut = (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee);
        require(amountOut >= minAmountOut, "Slippage exceeded");
        require(amountOut <= reserveOut, "Insufficient liquidity");

        // Update reserves
        if (pool.tokenA == tokenIn) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }

        // Protocol fee
        uint256 protocolFee = (fee * protocolFeeRate) / pool.swapFee;
        if (protocolFee > 0) {
            IERC20(tokenIn).safeTransfer(feeCollector, protocolFee);
        }
        pool.totalFees += fee;

        // Transfer output
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        // Record swap
        _swapIds.increment();
        uint256 swapId = _swapIds.current();

        swaps[swapId] = SwapRecord({
            id: swapId,
            user: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            fee: fee,
            timestamp: block.timestamp
        });
        userSwaps[msg.sender].push(swapId);

        emit Swapped(swapId, msg.sender, tokenIn, tokenOut, amountIn, amountOut, fee);
    }

    /**
     * @dev Get expected output amount for a swap
     */
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut, uint256 fee) {
        bytes32 poolKey = getPoolKey(tokenIn, tokenOut);
        LiquidityPool storage pool = pools[poolKey];
        require(pool.isActive, "Pool not active");

        (uint256 reserveIn, uint256 reserveOut) = pool.tokenA == tokenIn
            ? (pool.reserveA, pool.reserveB)
            : (pool.reserveB, pool.reserveA);

        fee = (amountIn * pool.swapFee) / 10000;
        uint256 amountInAfterFee = amountIn - fee;
        amountOut = (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee);
    }

    /**
     * @dev Get pool key for a token pair (order-independent)
     */
    function getPoolKey(address tokenA, address tokenB) public pure returns (bytes32) {
        (address t0, address t1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return keccak256(abi.encodePacked(t0, t1));
    }

    /**
     * @dev Get user swap history
     */
    function getUserSwaps(address user) external view returns (uint256[] memory) {
        return userSwaps[user];
    }

    // Admin

    function setProtocolFeeRate(uint256 _rate) external onlyOwner {
        require(_rate <= 100, "Max 1%");
        protocolFeeRate = _rate;
    }

    function setFeeCollector(address _collector) external onlyOwner {
        feeCollector = _collector;
    }

    function setMaxSlippage(uint256 _slippage) external onlyOwner {
        maxSlippage = _slippage;
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
