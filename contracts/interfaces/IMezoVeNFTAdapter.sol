// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMezoVeNFTAdapter {
    function isSupported(address collection) external view returns (bool);
    function isExpired(address collection, uint256 tokenId) external view returns (bool);
    function getIntrinsicValue(address collection, uint256 tokenId) external view returns (uint256 value, uint256 lockEnd);
    function getVotingPower(address collection, uint256 tokenId) external view returns (uint256);
    function calculateDiscount(uint256 listingPrice, uint256 intrinsicValue) external pure returns (uint256 discountBps);
}
