// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {LionGenetics} from '../LionGenetics.sol';
import {TraitCatalog} from '../generated/TraitCatalog.sol';
import {LionArt} from '../LionArt.sol';

/// @dev Test-only pure entry points; never deployed by the application deploy script.
contract LionHarness {
    function founder(
        uint256 seed
    ) external pure returns (uint8[18] memory genes, uint8 spectrum) {
        return LionGenetics.founder(seed);
    }
    function inheritGenes(
        uint8[18] memory a,
        uint8[18] memory b,
        uint8 speciesA,
        uint8 speciesB,
        uint256 seed
    ) external pure returns (uint8[18] memory genes, uint8 spectrum) {
        return LionGenetics.breed(a, b, speciesA, speciesB, seed);
    }
    function thresholds(
        uint8[18] memory a,
        uint8[18] memory b,
        uint8 speciesA,
        uint8 speciesB
    ) external pure returns (uint256 threshold, uint256 monochrome) {
        return LionGenetics.spectrumThresholds(a, b, speciesA, speciesB);
    }
    function draw(uint256 locus, uint256 word) external pure returns (uint8) {
        return TraitCatalog.draw(locus, word);
    }
    function art(
        uint8 species,
        uint8 mane,
        uint8 eyes,
        uint8 crown
    ) external pure returns (string memory) {
        return LionArt.render(species, 0, mane, eyes, 5, 3, crown);
    }
}
