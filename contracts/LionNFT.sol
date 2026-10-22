// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import {ERC721Enumerable} from '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import {Base64} from '@openzeppelin/contracts/utils/Base64.sol';
import {Strings} from '@openzeppelin/contracts/utils/Strings.sol';
import {LionArt} from './LionArt.sol';
import {LionGenetics} from './LionGenetics.sol';
import {TraitCatalog} from './generated/TraitCatalog.sol';

/// @notice Educational, free-to-mint NFT game; only network gas is charged.
/// @dev Randomness is predictable/influenceable. Use verifiable randomness before
///      attaching economic value. No admin, fees, external metadata, or upgrade proxy.
contract LionNFT is ERC721Enumerable, ReentrancyGuard {
    using Strings for uint256;

    struct Lion {
        uint8 species;
        uint8 fur;
        uint8 mane;
        uint8 eyes;
        uint8 pattern;
        uint8 temperament;
        uint8 aura;
        uint8 crown;
        uint8 rarity;
        uint32 generation;
        uint64 bornAt;
        uint256 parentA;
        uint256 parentB;
        uint256 dna;
    }

    uint256 public constant GENETICS_VERSION = TraitCatalog.VERSION;
    uint256 public constant MAX_CHILD_PAGE = 24;
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant BREED_COOLDOWN = 5 minutes;
    mapping(uint256 => Lion) private _lions;
    mapping(uint256 => uint8[18]) private _genes;
    mapping(uint256 => uint256[]) private _children;
    mapping(uint256 => uint256) public nextBreedAt;
    event LionBorn(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 parentA,
        uint256 parentB
    );
    error SoldOut();
    error InvalidPageSize();
    error SameParent();
    error NotParentOwner();
    error ParentResting(uint256 tokenId, uint256 readyAt);

    constructor() ERC721('Lionverse', 'LION') {}

    /// @notice Mints a Gen 0 lion with two alleles at each locus; only network gas is charged.
    function mint() external nonReentrant returns (uint256) {
        return _create(0, 0);
    }

    /// @notice Breeds two owned, distinct parents after both cooldowns expire.
    /// @dev Parent indexes and genes are recorded before the ERC-721 receiver callback.
    function breed(
        uint256 parentA,
        uint256 parentB
    ) external nonReentrant returns (uint256) {
        if (parentA == parentB) revert SameParent();
        if (ownerOf(parentA) != msg.sender || ownerOf(parentB) != msg.sender)
            revert NotParentOwner();
        if (block.timestamp < nextBreedAt[parentA])
            revert ParentResting(parentA, nextBreedAt[parentA]);
        if (block.timestamp < nextBreedAt[parentB])
            revert ParentResting(parentB, nextBreedAt[parentB]);
        nextBreedAt[parentA] = block.timestamp + BREED_COOLDOWN;
        nextBreedAt[parentB] = block.timestamp + BREED_COOLDOWN;
        return _create(parentA, parentB);
    }

    /// @notice Returns immutable expressed traits and ancestry for an existing token.
    function getLion(uint256 tokenId) external view returns (Lion memory) {
        _requireOwned(tokenId);
        return _lions[tokenId];
    }

    /// @notice Returns public immutable allele pairs, including non-visible genes.
    function getGenes(uint256 tokenId) external view returns (uint8[18] memory) {
        _requireOwned(tokenId);
        return _genes[tokenId];
    }

    /// @notice Number of direct children, independent of present NFT ownership.
    function childCount(uint256 tokenId) external view returns (uint256) {
        _requireOwned(tokenId);
        return _children[tokenId].length;
    }

    /// @notice Bounded lineage reads avoid scanning every birth event in the browser.
    function childrenOf(
        uint256 tokenId,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory ids) {
        _requireOwned(tokenId);
        if (limit == 0 || limit > MAX_CHILD_PAGE) revert InvalidPageSize();
        uint256 length = _children[tokenId].length;
        uint256 count = offset >= length
            ? 0
            : (length - offset < limit ? length - offset : limit);
        ids = new uint256[](count);
        for (uint256 i; i < count; ++i) ids[i] = _children[tokenId][offset + i];
    }

    function _create(uint256 parentA, uint256 parentB) private returns (uint256 tokenId) {
        tokenId = totalSupply() + 1;
        if (tokenId > MAX_SUPPLY) revert SoldOut();
        uint256 seed = uint256(
            keccak256(
                abi.encode(
                    block.prevrandao,
                    blockhash(block.number - 1),
                    block.timestamp,
                    msg.sender,
                    address(this),
                    block.chainid,
                    tokenId
                )
            )
        );
        Lion memory lion;
        lion.bornAt = uint64(block.timestamp);
        lion.parentA = parentA;
        lion.parentB = parentB;
        lion.dna = seed;
        uint8[18] memory genes;
        uint8 spectrum;
        if (parentA == 0) {
            (genes, spectrum) = LionGenetics.founder(seed);
        } else {
            Lion memory a = _lions[parentA];
            Lion memory b = _lions[parentB];
            (genes, spectrum) = LionGenetics.breed(
                _genes[parentA],
                _genes[parentB],
                a.species,
                b.species,
                seed
            );
            lion.generation =
                (a.generation > b.generation ? a.generation : b.generation) +
                1;
            _children[parentA].push(tokenId);
            _children[parentB].push(tokenId);
        }
        uint8[8] memory values = LionGenetics.phenotype(genes, spectrum);
        lion.species = values[0];
        lion.fur = values[1];
        lion.mane = values[2];
        lion.eyes = values[3];
        lion.pattern = values[4];
        lion.temperament = values[5];
        lion.aura = values[6];
        lion.crown = values[7];
        _genes[tokenId] = genes;
        lion.rarity = _rarity(lion);
        _lions[tokenId] = lion;
        // A newborn also rests before its first breeding.
        nextBreedAt[tokenId] = block.timestamp + BREED_COOLDOWN;
        _safeMint(msg.sender, tokenId);
        emit LionBorn(msg.sender, tokenId, parentA, parentB);
    }

    function _rarity(Lion memory l) private pure returns (uint8) {
        if (l.species >= 4 || l.mane == 8 || l.eyes == 6 || l.crown == 3) return 3;
        if (
            l.species == 3 || l.mane == 7 || l.pattern == 5 || l.crown == 2 || l.aura == 3
        ) return 2;
        if (
            l.species == 2 ||
            l.mane == 6 ||
            l.eyes == 5 ||
            l.pattern >= 3 ||
            l.crown == 1 ||
            l.aura > 0 ||
            l.temperament == 5
        ) return 1;
        return 0;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Lion memory l = _lions[tokenId];
        string memory attributes = string.concat(
            _attribute('Species', l.species),
            ',',
            _attribute('Aura', l.aura),
            ',',
            _attribute('Crown', l.crown),
            ',',
            _attribute('Fur', l.fur),
            ',',
            _attribute('Mane', l.mane),
            ',',
            _attribute('Eyes', l.eyes),
            ',',
            _attribute('Pattern', l.pattern),
            ',',
            _attribute('Temperament', l.temperament),
            ',',
            _attribute('Rarity', l.rarity),
            ',',
            _attribute('Generation', l.generation),
            ',',
            _attribute('Parent A', l.parentA),
            ',',
            _attribute('Parent B', l.parentB)
        );
        return
            string.concat(
                'data:application/json;base64,',
                Base64.encode(
                    bytes(
                        string.concat(
                            '{"name":"Lion #',
                            tokenId.toString(),
                            '","description":"A unique on-chain Lionverse lion. Educational testnet collectible.",',
                            '"image":"data:image/svg+xml;base64,',
                            Base64.encode(
                                bytes(
                                    LionArt.render(
                                        l.species,
                                        l.fur,
                                        l.mane,
                                        l.eyes,
                                        l.pattern,
                                        l.aura,
                                        l.crown
                                    )
                                )
                            ),
                            '","genetics_version":2,"genes":[',
                            _genesJson(tokenId),
                            '],"attributes":[',
                            attributes,
                            ']}'
                        )
                    )
                )
            );
    }

    function _genesJson(uint256 tokenId) private view returns (string memory json) {
        uint8[18] memory genes = _genes[tokenId];
        for (uint256 i; i < genes.length; ++i) {
            json = string.concat(json, i == 0 ? '' : ',', uint256(genes[i]).toString());
        }
    }

    function _attribute(
        string memory key,
        uint256 value
    ) private pure returns (string memory) {
        return string.concat('{"trait_type":"', key, '","value":', value.toString(), '}');
    }
}
