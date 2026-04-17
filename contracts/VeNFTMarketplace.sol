// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMezoVeNFTAdapter.sol";
import "./interfaces/IPaymentRouter.sol";

contract VeNFTMarketplace is ReentrancyGuard {
    IMezoVeNFTAdapter public immutable adapter;
    IPaymentRouter public immutable paymentRouter;
    address public immutable adminContract;

    struct Listing {
        address seller;
        address collection;
        uint256 tokenId;
        uint256 price;
        address paymentToken;
        uint256 createdAt;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId;
    mapping(address => uint256[]) public userListings;
    mapping(address => mapping(address => uint256)) public floorPrices;
    mapping(address => mapping(uint256 => uint256)) private _activeListingByToken;

    event Listed(uint256 indexed listingId, address indexed seller, address indexed collection, uint256 tokenId, uint256 price, address paymentToken);
    event Cancelled(uint256 indexed listingId);
    event Purchased(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price);
    event PriceUpdated(uint256 indexed listingId, uint256 oldPrice, uint256 newPrice);

    error Paused();
    error NotOwner();
    error NotApproved();
    error UnsupportedCollection();
    error UnsupportedPaymentToken();
    error ListingNotActive();
    error InsufficientPayment();
    error InvalidPrice();
    error TransferFailed();
    error ExpiredVeNFT();
    error SelfPurchase();
    error PauseCheckFailed();
    error InsufficientAllowance();
    error AlreadyListed();

    modifier whenNotPaused() {
        (bool success, bytes memory data) = adminContract.staticcall(abi.encodeWithSignature("isPaused()"));
        if (!success || data.length < 32) revert PauseCheckFailed();
        if (abi.decode(data, (bool))) revert Paused();
        _;
    }

    constructor(address _adapter, address _paymentRouter, address _adminContract) {
        require(_adapter != address(0), "Invalid adapter");
        require(_paymentRouter != address(0), "Invalid router");
        require(_adminContract != address(0), "Invalid admin");

        adapter = IMezoVeNFTAdapter(_adapter);
        paymentRouter = IPaymentRouter(_paymentRouter);
        adminContract = _adminContract;
    }

    function listNFT(address collection, uint256 tokenId, uint256 price, address paymentToken)
        external whenNotPaused nonReentrant returns (uint256 listingId)
    {
        if (!adapter.isSupported(collection)) revert UnsupportedCollection();
        if (!paymentRouter.supportedTokens(paymentToken)) revert UnsupportedPaymentToken();
        if (price == 0) revert InvalidPrice();

        IERC721 nft = IERC721(collection);
        if (nft.ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (nft.getApproved(tokenId) != address(this) && !nft.isApprovedForAll(msg.sender, address(this))) revert NotApproved();
        if (_activeListingByToken[collection][tokenId] != 0) revert AlreadyListed();

        listingId = nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            collection: collection,
            tokenId: tokenId,
            price: price,
            paymentToken: paymentToken,
            createdAt: block.timestamp,
            active: true
        });
        userListings[msg.sender].push(listingId);
        _activeListingByToken[collection][tokenId] = listingId + 1;

        uint256 currentFloor = floorPrices[collection][paymentToken];
        if (currentFloor == 0 || price < currentFloor) {
            floorPrices[collection][paymentToken] = price;
        }

        emit Listed(listingId, msg.sender, collection, tokenId, price, paymentToken);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotOwner();
        listing.active = false;
        _activeListingByToken[listing.collection][listing.tokenId] = 0;
        emit Cancelled(listingId);
    }

    function updatePrice(uint256 listingId, uint256 newPrice) external whenNotPaused nonReentrant {
        if (newPrice == 0) revert InvalidPrice();
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotOwner();

        uint256 oldPrice = listing.price;
        listing.price = newPrice;
        if (newPrice < floorPrices[listing.collection][listing.paymentToken]) {
            floorPrices[listing.collection][listing.paymentToken] = newPrice;
        }
        emit PriceUpdated(listingId, oldPrice, newPrice);
    }

    function buyNFT(uint256 listingId) external payable whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive();
        if (listing.seller == msg.sender) revert SelfPurchase();
        if (adapter.isExpired(listing.collection, listing.tokenId)) revert ExpiredVeNFT();
        if (IERC721(listing.collection).ownerOf(listing.tokenId) != listing.seller) revert NotOwner();

        listing.active = false;
        _activeListingByToken[listing.collection][listing.tokenId] = 0;

        address seller = listing.seller;
        address collection = listing.collection;
        uint256 tokenId = listing.tokenId;
        uint256 price = listing.price;
        address paymentToken = listing.paymentToken;

        if (paymentToken != paymentRouter.BTC()) {
            uint256 allowance = IERC20(paymentToken).allowance(msg.sender, address(paymentRouter));
            if (allowance < price) revert InsufficientAllowance();
        }

        IERC721(collection).safeTransferFrom(seller, msg.sender, tokenId);

        if (paymentToken == paymentRouter.BTC()) {
            if (msg.value < price) revert InsufficientPayment();
            paymentRouter.routePayment{value: price}(msg.sender, seller, paymentToken, price);
            if (msg.value > price) {
                (bool refundSuccess, ) = msg.sender.call{value: msg.value - price}("");
                if (!refundSuccess) revert TransferFailed();
            }
        } else {
            paymentRouter.routePayment(msg.sender, seller, paymentToken, price);
        }

        emit Purchased(listingId, msg.sender, seller, price);
    }

    function getListingWithValue(uint256 listingId)
        external view
        returns (Listing memory listing, uint256 intrinsicValue, uint256 lockEnd, uint256 votingPower, uint256 discountBps)
    {
        listing = listings[listingId];
        if (listing.collection != address(0)) {
            (intrinsicValue, lockEnd) = adapter.getIntrinsicValue(listing.collection, listing.tokenId);
            votingPower = adapter.getVotingPower(listing.collection, listing.tokenId);
            discountBps = adapter.calculateDiscount(listing.price, intrinsicValue);
        }
    }

    function getActiveListings(address collection, uint256 offset, uint256 limit)
        external view returns (Listing[] memory result, uint256 total)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < nextListingId; i++) {
            if (listings[i].active && listings[i].collection == collection) count++;
        }
        total = count;
        if (offset >= count) return (new Listing[](0), total);

        uint256 resultSize = limit;
        if (offset + limit > count) resultSize = count - offset;
        result = new Listing[](resultSize);

        uint256 found = 0;
        uint256 added = 0;
        for (uint256 i = 0; i < nextListingId && added < resultSize; i++) {
            if (listings[i].active && listings[i].collection == collection) {
                if (found >= offset) {
                    result[added] = listings[i];
                    added++;
                }
                found++;
            }
        }
    }

    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }

    function getFloorPrice(address collection, address paymentToken) external view returns (uint256) {
        return floorPrices[collection][paymentToken];
    }
}
