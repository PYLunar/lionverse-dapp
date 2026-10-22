// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TraitCatalog as Catalog} from './generated/TraitCatalog.sol';

/// @notice Pure, versioned inheritance rules shared with the demo through parity tests.
/// @dev Allele order is stable: eight ordinary loci followed by spectrum predisposition.
library LionGenetics {
    uint256 internal constant SPECTRUM = 8;

    /// @dev Domain separation prevents different inheritance decisions reusing random bits.
    function word(
        uint256 seed,
        uint256 domain,
        uint256 locus
    ) internal pure returns (uint256) {
        return uint256(keccak256(abi.encode(seed, domain, locus)));
    }

    /// @return genes Two alleles per locus, including non-visible predispositions.
    /// @return spectrum 0 = natural, 1 = prismatic, 2 = monochrome prismatic.
    function founder(
        uint256 seed
    ) internal pure returns (uint8[18] memory genes, uint8 spectrum) {
        for (uint256 i; i < Catalog.LOCUS_COUNT; ++i) {
            uint8 visible = i == SPECTRUM ? 0 : Catalog.draw(i, word(seed, 0, i));
            uint8 latent = Catalog.draw(i, word(seed, 1, i));
            genes[i * 2] = visible;
            genes[i * 2 + 1] = latent > visible ? latent : visible;
        }
        uint256 roll = word(seed, 20, 0) % Catalog.SPECTRUM_DENOMINATOR;
        spectrum = roll < Catalog.FOUNDER_MONOCHROME
            ? 2
            : roll < Catalog.FOUNDER_PRISMATIC
                ? 1
                : 0;
        if (spectrum != 0) {
            genes[16] = spectrum;
            genes[17] = spectrum;
        }
    }

    /// @dev Each parent contributes one random allele. A locus may mutate one allele,
    /// not both. Spectrum appearance always passes a separate capped rarity gate.
    function breed(
        uint8[18] memory a,
        uint8[18] memory b,
        uint8 speciesA,
        uint8 speciesB,
        uint256 seed
    ) internal pure returns (uint8[18] memory genes, uint8 spectrum) {
        for (uint256 i; i < Catalog.LOCUS_COUNT; ++i) {
            genes[i * 2] = a[i * 2 + (word(seed, 2, i) % 2)];
            genes[i * 2 + 1] = b[i * 2 + (word(seed, 3, i) % 2)];
            if (word(seed, 4, i) % Catalog.MUTATION_DENOMINATOR == 0) {
                genes[i * 2 + (word(seed, 5, i) % 2)] = Catalog.draw(i, word(seed, 6, i));
            }
        }
        (uint256 threshold, uint256 monochrome) = spectrumThresholds(
            a,
            b,
            speciesA,
            speciesB
        );
        if (word(seed, 20, 0) % Catalog.SPECTRUM_DENOMINATOR < threshold) {
            spectrum = word(seed, 21, 0) % Catalog.MONO_DENOMINATOR < monochrome ? 2 : 1;
            // A spontaneous awakening must remain represented in the offspring genome.
            if (genes[16] < spectrum) genes[16] = spectrum;
        }
    }

    /// @notice Both manifested spectrum parents still produce natural offspring 94% of the time.
    function spectrumThresholds(
        uint8[18] memory a,
        uint8[18] memory b,
        uint8 speciesA,
        uint8 speciesB
    ) internal pure returns (uint256 threshold, uint256 monochrome) {
        uint256 expressed = (speciesA >= 4 ? 1 : 0) + (speciesB >= 4 ? 1 : 0);
        uint256 carriers = (_carries(a, 1) ? 1 : 0) + (_carries(b, 1) ? 1 : 0);
        threshold = expressed == 2
            ? Catalog.BREED_TWO_EXPRESSED
            : expressed == 1
                ? Catalog.BREED_ONE_EXPRESSED
                : carriers == 2
                    ? Catalog.BREED_TWO_CARRIERS
                    : carriers == 1
                        ? Catalog.BREED_ONE_CARRIER
                        : Catalog.BREED_NO_CARRIER;
        uint256 visibleMono = (speciesA == 5 ? 1 : 0) + (speciesB == 5 ? 1 : 0);
        monochrome = visibleMono == 2
            ? Catalog.MONO_TWO_EXPRESSED
            : visibleMono == 1
                ? Catalog.MONO_ONE_EXPRESSED
                : _carries(a, 2) || _carries(b, 2)
                    ? Catalog.MONO_CARRIER
                    : Catalog.MONO_NORMAL;
    }

    /// @dev Ordinary dominance follows catalog order; spectrum does not use min().
    function phenotype(
        uint8[18] memory genes,
        uint8 spectrum
    ) internal pure returns (uint8[8] memory values) {
        for (uint256 i; i < SPECTRUM; ++i) {
            values[i] = genes[i * 2] < genes[i * 2 + 1] ? genes[i * 2] : genes[i * 2 + 1];
        }
        if (spectrum != 0) values[0] = spectrum == 2 ? 5 : 4;
    }

    function _carries(uint8[18] memory genes, uint8 allele) private pure returns (bool) {
        return genes[16] >= allele || genes[17] >= allele;
    }
}
