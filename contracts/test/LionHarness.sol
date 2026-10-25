// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {LionTraits} from '../LionTraits.sol';
contract LionHarness {
    function species(uint256 roll, uint256 baseRoll) external pure returns (uint8) {
        return LionTraits.species(roll, baseRoll);
    }
    function founder(uint256 seed) external pure returns (uint8[4] memory) {
        return LionTraits.founder(seed);
    }
    function inheritTraits(
        uint8[4] memory a,
        uint8[4] memory b,
        uint256 seed
    ) external pure returns (uint8[4] memory) {
        return LionTraits.inheritTraits(a, b, seed);
    }
}
