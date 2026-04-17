// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IPaymentRouter.sol";

contract PaymentRouter is IPaymentRouter, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant BTC = 0x7b7C000000000000000000000000000000000000;
    address public constant MEZO = 0x7B7c000000000000000000000000000000000001;
    address public immutable MUSD;

    uint256 public override protocolFeeBps;
    uint256 public constant MAX_FEE_BPS = 500;
    address public override feeRecipient;
    address public admin;
    address public marketplace;
    address public pendingAdmin;

    mapping(address => bool) public override supportedTokens;

    event AdminTransferProposed(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);
    event TokenSupportUpdated(address indexed token, bool supported);
    event MarketplaceSet(address indexed marketplace);

    error InvalidAddress();
    error InvalidAmount();
    error UnsupportedToken(address token);
    error FeeTooHigh(uint256 requested, uint256 maximum);
    error TransferFailed();
    error Unauthorized();
    error InsufficientPayment(uint256 sent, uint256 required);
    error AlreadySet();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyMarketplace() {
        if (msg.sender != marketplace) revert Unauthorized();
        _;
    }

    constructor(address _feeRecipient, address _admin, address _musd, uint256 _initialFeeBps) {
        if (_feeRecipient == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();
        if (_musd == address(0)) revert InvalidAddress();
        if (_initialFeeBps > MAX_FEE_BPS) revert FeeTooHigh(_initialFeeBps, MAX_FEE_BPS);

        feeRecipient = _feeRecipient;
        admin = _admin;
        MUSD = _musd;
        protocolFeeBps = _initialFeeBps;

        supportedTokens[BTC] = true;
        supportedTokens[MEZO] = true;
        supportedTokens[_musd] = true;
    }

    function setMarketplace(address _marketplace) external onlyAdmin {
        if (_marketplace == address(0)) revert InvalidAddress();
        if (marketplace != address(0)) revert AlreadySet();
        marketplace = _marketplace;
        emit MarketplaceSet(_marketplace);
    }

    function routePayment(address buyer, address seller, address token, uint256 amount)
        external payable override nonReentrant onlyMarketplace
    {
        if (buyer == address(0)) revert InvalidAddress();
        if (seller == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (!supportedTokens[token]) revert UnsupportedToken(token);

        (uint256 fee, uint256 sellerAmount) = calculateFee(amount);

        if (token == BTC) {
            if (msg.value != amount) revert InsufficientPayment(msg.value, amount);
            (bool sellerSuccess, ) = payable(seller).call{value: sellerAmount}("");
            if (!sellerSuccess) revert TransferFailed();
            if (fee > 0) {
                (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
                if (!feeSuccess) revert TransferFailed();
            }
        } else {
            if (msg.value != 0) revert InvalidAmount();
            IERC20(token).safeTransferFrom(buyer, seller, sellerAmount);
            if (fee > 0) {
                IERC20(token).safeTransferFrom(buyer, feeRecipient, fee);
            }
        }

        emit PaymentRouted(buyer, seller, token, amount, fee);
    }

    function calculateFee(uint256 amount) public view override returns (uint256 fee, uint256 sellerAmount) {
        fee = (amount * protocolFeeBps) / 10000;
        sellerAmount = amount - fee;
    }

    function setProtocolFee(uint256 _feeBps) external onlyAdmin {
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh(_feeBps, MAX_FEE_BPS);
        uint256 oldFee = protocolFeeBps;
        protocolFeeBps = _feeBps;
        emit ProtocolFeeUpdated(oldFee, _feeBps);
    }

    function setFeeRecipient(address _recipient) external onlyAdmin {
        if (_recipient == address(0)) revert InvalidAddress();
        address oldRecipient = feeRecipient;
        feeRecipient = _recipient;
        emit FeeRecipientUpdated(oldRecipient, _recipient);
    }

    function setTokenSupport(address token, bool supported) external onlyAdmin {
        supportedTokens[token] = supported;
        emit TokenSupportUpdated(token, supported);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert InvalidAddress();
        pendingAdmin = newAdmin;
        emit AdminTransferProposed(admin, newAdmin);
    }

    function acceptAdmin() external {
        if (msg.sender != pendingAdmin) revert Unauthorized();
        address oldAdmin = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        emit AdminTransferred(oldAdmin, admin);
    }

    function sweepBTC() external onlyAdmin nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InvalidAmount();
        (bool success, ) = payable(admin).call{value: balance}("");
        if (!success) revert TransferFailed();
    }

    receive() external payable {}
}
