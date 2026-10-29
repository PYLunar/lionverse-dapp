// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {LionNFT} from '../LionNFT.sol';
/// @dev Test-only supply boundary setup; never deployed by application scripts.
contract LionSupplyHarness is LionNFT {
    function setMintedForTest(uint256 value) external {
        totalMinted = value;
    }
}
