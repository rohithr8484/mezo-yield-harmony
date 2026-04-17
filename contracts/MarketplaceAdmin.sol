// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title MarketplaceAdmin
/// @notice Admin controls for veNFT marketplace: pause, whitelist, fee governance
/// @dev Uses OpenZeppelin AccessControl for role-based permissions
contract MarketplaceAdmin is AccessControl, Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    bytes32 public constant COLLECTION_MANAGER_ROLE = keccak256("COLLECTION_MANAGER_ROLE");

    uint256 public constant FEE_TIMELOCK = 48 hours;

    address public constant VEBTC_MAINNET = 0x3D4b1b884A7a1E59fE8589a3296EC8f8cBB6f279;
    address public constant VEBTC_TESTNET = 0x38E35d92E6Bfc6787272A62345856B13eA12130a;
    address public constant VEMEZO_MAINNET = 0xb90fdAd3DFD180458D62Cc6acedc983D78E20122;
    address public constant VEMEZO_TESTNET = 0xaCE816CA2bcc9b12C59799dcC5A959Fb9b98111b;

    struct PendingFeeChange {
        uint256 newFeeBps;
        uint256 effectiveTime;
        bool pending;
    }

    PendingFeeChange public pendingFee;
    mapping(address => bool) public supportedCollections;
    address public paymentRouter;

    event CollectionAdded(address indexed collection);
    event CollectionRemoved(address indexed collection);
    event FeeChangeProposed(uint256 newFeeBps, uint256 effectiveTime);
    event FeeChangeExecuted(uint256 newFeeBps);
    event FeeChangeCancelled();
    event EmergencyPause(address indexed pauser, string reason);
    event PaymentRouterSet(address indexed router);

    error TimelockActive(uint256 remainingTime);
    error NoPendingChange();
    error InvalidAddress();
    error AlreadyWhitelisted();
    error NotWhitelisted();
    error PendingChangeExists();
    error RouterNotSet();

    constructor(address defaultAdmin, bool isTestnet) {
        if (defaultAdmin == address(0)) revert InvalidAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(FEE_MANAGER_ROLE, defaultAdmin);
        _grantRole(COLLECTION_MANAGER_ROLE, defaultAdmin);

        if (isTestnet) {
            supportedCollections[VEBTC_TESTNET] = true;
            supportedCollections[VEMEZO_TESTNET] = true;
            emit CollectionAdded(VEBTC_TESTNET);
            emit CollectionAdded(VEMEZO_TESTNET);
        } else {
            supportedCollections[VEBTC_MAINNET] = true;
            supportedCollections[VEMEZO_MAINNET] = true;
            emit CollectionAdded(VEBTC_MAINNET);
            emit CollectionAdded(VEMEZO_MAINNET);
        }
    }

    function setPaymentRouter(address _router) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_router == address(0)) revert InvalidAddress();
        paymentRouter = _router;
        emit PaymentRouterSet(_router);
    }

    function acceptRouterAdmin() external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (paymentRouter == address(0)) revert RouterNotSet();
        (bool success, ) = paymentRouter.call(abi.encodeWithSignature("acceptAdmin()"));
        require(success, "Accept admin failed");
    }

    function emergencyPause(string calldata reason) external onlyRole(PAUSER_ROLE) {
        _pause();
        emit EmergencyPause(msg.sender, reason);
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function proposeFeeChange(uint256 _newFeeBps) external onlyRole(FEE_MANAGER_ROLE) {
        require(_newFeeBps <= 500, "Max 5%");
        if (pendingFee.pending) revert PendingChangeExists();

        pendingFee = PendingFeeChange({
            newFeeBps: _newFeeBps,
            effectiveTime: block.timestamp + FEE_TIMELOCK,
            pending: true
        });

        emit FeeChangeProposed(_newFeeBps, pendingFee.effectiveTime);
    }

    function executeFeeChange() external onlyRole(FEE_MANAGER_ROLE) {
        if (!pendingFee.pending) revert NoPendingChange();
        if (block.timestamp < pendingFee.effectiveTime) {
            revert TimelockActive(pendingFee.effectiveTime - block.timestamp);
        }
        if (paymentRouter == address(0)) revert RouterNotSet();

        uint256 newFee = pendingFee.newFeeBps;
        delete pendingFee;

        (bool success, ) = paymentRouter.call(
            abi.encodeWithSignature("setProtocolFee(uint256)", newFee)
        );
        require(success, "Fee update failed");

        emit FeeChangeExecuted(newFee);
    }

    function cancelFeeChange() external onlyRole(FEE_MANAGER_ROLE) {
        if (!pendingFee.pending) revert NoPendingChange();
        delete pendingFee;
        emit FeeChangeCancelled();
    }

    function addCollection(address collection) external onlyRole(COLLECTION_MANAGER_ROLE) {
        if (collection == address(0)) revert InvalidAddress();
        if (supportedCollections[collection]) revert AlreadyWhitelisted();
        supportedCollections[collection] = true;
        emit CollectionAdded(collection);
    }

    function removeCollection(address collection) external onlyRole(COLLECTION_MANAGER_ROLE) {
        if (!supportedCollections[collection]) revert NotWhitelisted();
        supportedCollections[collection] = false;
        emit CollectionRemoved(collection);
    }

    function isCollectionSupported(address collection) external view returns (bool) {
        return supportedCollections[collection];
    }

    function isPaused() external view returns (bool) {
        return paused();
    }

    function getPendingFeeChange()
        external
        view
        returns (uint256 newFeeBps, uint256 effectiveTime, bool isPending)
    {
        return (pendingFee.newFeeBps, pendingFee.effectiveTime, pendingFee.pending);
    }
}
