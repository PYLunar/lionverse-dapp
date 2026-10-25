// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {LionNFT} from '../LionNFT.sol';
import {LionMarketplace} from '../LionMarketplace.sol';
import {IERC721Receiver} from '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';

/// @dev Test-only buyer/seller for receiver rejection and withdrawal reentry.
contract MarketActor is IERC721Receiver {
    LionNFT public immutable nft;
    LionMarketplace public immutable market;
    bool public rejectNFT;
    bool public rejectETH;
    bool public reenter;
    bool public reentryBlocked;
    constructor(LionNFT n, LionMarketplace m) {
        nft = n;
        market = m;
    }
    function configure(bool rejectNft, bool rejectEth, bool attack) external {
        rejectNFT = rejectNft;
        rejectETH = rejectEth;
        reenter = attack;
    }
    function mintAndList(uint256 price) external {
        uint256 id = nft.mint();
        nft.approve(address(market), id);
        market.list(id, price);
    }
    function buy(uint256 id) external payable {
        market.buy{value: msg.value}(id);
    }
    function withdraw() external {
        market.withdraw();
    }
    receive() external payable {
        require(!rejectETH, 'Reject ETH');
        if (reenter) {
            try market.withdraw() {} catch {
                reentryBlocked = true;
            }
        }
    }
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external view returns (bytes4) {
        require(!rejectNFT, 'Reject NFT');
        return IERC721Receiver.onERC721Received.selector;
    }
}
