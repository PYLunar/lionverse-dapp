// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {IERC721Receiver} from '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

/// @notice Fixed-price, ETH-only marketplace for one LionNFT collection. No fees.
/// @dev Listings escrow the NFT. Sale proceeds are withdrawn separately by sellers.
contract LionMarketplace is IERC721Receiver, ReentrancyGuard {
    IERC721 public immutable nft;
    struct Listing {
        address seller;
        uint256 price;
    }
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public proceeds;
    bool private _depositing;

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Cancelled(uint256 indexed tokenId, address indexed seller);
    event Sale(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );
    event Withdrawn(address indexed seller, uint256 amount);
    error InvalidCollection();
    error InvalidPrice();
    error NotOwner();
    error NotListed();
    error NotSeller();
    error WrongPayment();
    error SelfPurchase();
    error NoProceeds();
    error PaymentFailed();
    error DirectDeposit();

    constructor(address collection) {
        if (collection.code.length == 0) revert InvalidCollection();
        nft = IERC721(collection);
    }

    /// @notice Approve this contract for the token before listing.
    function list(uint256 tokenId, uint256 price) external nonReentrant {
        if (price == 0) revert InvalidPrice();
        if (nft.ownerOf(tokenId) != msg.sender) revert NotOwner();
        listings[tokenId] = Listing(msg.sender, price);
        _depositing = true;
        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        _depositing = false;
        emit Listed(tokenId, msg.sender, price);
    }

    function cancel(uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[tokenId];
        if (listing.seller == address(0)) revert NotListed();
        if (listing.seller != msg.sender) revert NotSeller();
        delete listings[tokenId];
        nft.safeTransferFrom(address(this), msg.sender, tokenId);
        emit Cancelled(tokenId, msg.sender);
    }

    /// @notice Exact ETH price; ownership transfer and credit happen atomically.
    function buy(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        if (listing.seller == address(0)) revert NotListed();
        if (listing.seller == msg.sender) revert SelfPurchase();
        if (msg.value != listing.price) revert WrongPayment();
        delete listings[tokenId];
        proceeds[listing.seller] += msg.value;
        nft.safeTransferFrom(address(this), msg.sender, tokenId);
        emit Sale(tokenId, listing.seller, msg.sender, msg.value);
    }

    function withdraw() external nonReentrant {
        uint256 amount = proceeds[msg.sender];
        if (amount == 0) revert NoProceeds();
        proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}('');
        if (!success) revert PaymentFailed();
        emit Withdrawn(msg.sender, amount);
    }

    /// @dev Only a transfer initiated by list() may use the receiver callback.
    function onERC721Received(
        address operator,
        address,
        uint256,
        bytes calldata
    ) external view returns (bytes4) {
        if (msg.sender != address(nft) || operator != address(this) || !_depositing)
            revert DirectDeposit();
        return IERC721Receiver.onERC721Received.selector;
    }
}
