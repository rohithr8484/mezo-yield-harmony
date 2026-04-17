// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPaymentRouter {
    event PaymentRouted(address indexed buyer, address indexed seller, address indexed token, uint256 amount, uint256 fee);
    event ProtocolFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    function routePayment(address buyer, address seller, address token, uint256 amount) external payable;
    function calculateFee(uint256 amount) external view returns (uint256 fee, uint256 sellerAmount);
    function protocolFeeBps() external view returns (uint256);
    function feeRecipient() external view returns (address);
    function supportedTokens(address token) external view returns (bool);
    function BTC() external view returns (address);
}
