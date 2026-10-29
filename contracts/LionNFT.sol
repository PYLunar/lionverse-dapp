// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import {ERC721Enumerable} from '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import {Base64} from '@openzeppelin/contracts/utils/Base64.sol';
import {Strings} from '@openzeppelin/contracts/utils/Strings.sol';
import {LionTraits} from './LionTraits.sol';
import {LionArt} from './LionArt.sol';

/// @notice Educational testnet NFT. Minting is free except for network gas.
/// @dev Block-based randomness is for coursework, not paid draws.
contract LionNFT is ERC721Enumerable, ReentrancyGuard {
    using Strings for uint256;
    struct Lion {
        uint8 species;
        uint8 fur;
        uint8 mane;
        uint8 eyes;
        uint32 generation;
        uint64 bornAt;
        uint256 parentA;
        uint256 parentB;
    }
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant BREED_COOLDOWN = 5 minutes;
    /// @notice Lifetime mints, including burned tokens. IDs are never reused.
    uint256 public totalMinted;
    mapping(uint256 => Lion) private _lions;
    mapping(uint256 => uint256) public nextBreedAt;
    event LionBorn(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 parentA,
        uint256 parentB
    );
    event LionBurned(address indexed owner, uint256 indexed tokenId);
    error NotTokenOwner();
    error SoldOut();
    error SameParent();
    error NotParentOwner();
    error ParentResting(uint256 tokenId, uint256 readyAt);

    constructor() ERC721('Lionverse', 'LION') {}

    function mint() external nonReentrant returns (uint256) {
        return _create(0, 0);
    }

    /// @notice Only the owner may permanently destroy a token, not an operator.
    /// @dev Historical traits/parents remain readable for descendants.
    function burn(uint256 tokenId) external nonReentrant {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        _burn(tokenId);
        emit LionBurned(msg.sender, tokenId);
    }

    function isBurned(uint256 tokenId) external view returns (bool) {
        _requireKnown(tokenId);
        return _ownerOf(tokenId) == address(0);
    }

    function _requireKnown(uint256 tokenId) private view {
        if (tokenId == 0 || tokenId > totalMinted) revert ERC721NonexistentToken(tokenId);
    }

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
        nextBreedAt[parentA] = nextBreedAt[parentB] = block.timestamp + BREED_COOLDOWN;
        return _create(parentA, parentB);
    }

    function getLion(uint256 tokenId) external view returns (Lion memory) {
        _requireKnown(tokenId);
        return _lions[tokenId];
    }

    function _traits(Lion memory lion) private pure returns (uint8[4] memory) {
        return [lion.species, lion.fur, lion.mane, lion.eyes];
    }

    function _create(uint256 parentA, uint256 parentB) private returns (uint256 tokenId) {
        tokenId = totalMinted + 1;
        if (tokenId > MAX_SUPPLY) revert SoldOut();
        totalMinted = tokenId;
        uint256 seed = uint256(
            keccak256(
                abi.encode(
                    block.prevrandao,
                    blockhash(block.number - 1),
                    msg.sender,
                    address(this),
                    tokenId
                )
            )
        );
        Lion memory lion;
        uint8[4] memory traits;
        if (parentA == 0) traits = LionTraits.founder(seed);
        else {
            Lion memory a = _lions[parentA];
            Lion memory b = _lions[parentB];
            traits = LionTraits.inheritTraits(_traits(a), _traits(b), seed);
            lion.generation =
                (a.generation > b.generation ? a.generation : b.generation) +
                1;
        }
        lion.species = traits[0];
        lion.fur = traits[1];
        lion.mane = traits[2];
        lion.eyes = traits[3];
        lion.bornAt = uint64(block.timestamp);
        lion.parentA = parentA;
        lion.parentB = parentB;
        _lions[tokenId] = lion;
        nextBreedAt[tokenId] = block.timestamp + BREED_COOLDOWN;
        _safeMint(msg.sender, tokenId);
        emit LionBorn(msg.sender, tokenId, parentA, parentB);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _metadata(tokenId);
    }

    /// @notice Archived metadata for known tokens, including destroyed ancestors.
    function historicalTokenURI(uint256 tokenId) external view returns (string memory) {
        _requireKnown(tokenId);
        return _metadata(tokenId);
    }

    function _metadata(uint256 tokenId) private view returns (string memory) {
        Lion memory l = _lions[tokenId];
        return
            string.concat(
                'data:application/json;base64,',
                Base64.encode(
                    bytes(
                        string.concat(
                            '{"name":"Lion #',
                            tokenId.toString(),
                            '","description":"Lionverse coursework NFT: four visible traits and simple inheritance.","image":"data:image/svg+xml;base64,',
                            Base64.encode(
                                bytes(LionArt.render(l.species, l.fur, l.mane, l.eyes))
                            ),
                            '","burned":',
                            _ownerOf(tokenId) == address(0) ? 'true' : 'false',
                            ',"attributes":[',
                            _attribute('Species', l.species),
                            ',',
                            _attribute('Fur', l.fur),
                            ',',
                            _attribute('Mane', l.mane),
                            ',',
                            _attribute('Eyes', l.eyes),
                            ',',
                            _attribute('Generation', l.generation),
                            ',',
                            _attribute('Born At', l.bornAt),
                            ',',
                            _attribute('Parent A', l.parentA),
                            ',',
                            _attribute('Parent B', l.parentB),
                            ']}'
                        )
                    )
                )
            );
    }

    function _attribute(
        string memory key,
        uint256 value
    ) private pure returns (string memory) {
        return string.concat('{"trait_type":"', key, '","value":', value.toString(), '}');
    }
}
