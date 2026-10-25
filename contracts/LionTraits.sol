// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Four visible traits, with no hidden genes or mutations.
library LionTraits {
    function word(uint256 seed, uint256 field) internal pure returns (uint256) {
        return uint256(keccak256(abi.encode(seed, field)));
    }

    /// @dev Exactly 6000 natural, 3000 monochrome, 1000 rainbow outcomes per 10000.
    function species(uint256 roll, uint256 baseRoll) internal pure returns (uint8) {
        roll %= 10000;
        if (roll >= 9000) return 4;
        if (roll >= 6000) return 5;
        baseRoll %= 9850;
        if (baseRoll < 6200) return 0;
        if (baseRoll < 8600) return 1;
        if (baseRoll < 9500) return 2;
        return 3;
    }

    function founder(uint256 seed) internal pure returns (uint8[4] memory traits) {
        traits[0] = species(word(seed, 0), word(seed, 1));
        traits[1] = uint8(word(seed, 2) % 6);
        traits[2] = uint8(word(seed, 3) % 3);
        traits[3] = uint8(word(seed, 4) % 4);
    }

    function inheritTraits(
        uint8[4] memory a,
        uint8[4] memory b,
        uint256 seed
    ) internal pure returns (uint8[4] memory traits) {
        for (uint256 i; i < 4; ++i) traits[i] = word(seed, i) % 2 == 0 ? a[i] : b[i];
    }
}
