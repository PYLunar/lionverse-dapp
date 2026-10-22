/**
 * Public domain vocabulary. UI components receive these normalized objects,
 * never Ethers Result proxies or localStorage JSON strings.
 *
 * @typedef {number[]} Genome Exactly 18 alleles: two per stable catalog locus.
 *
 * @typedef {object} Lion
 * @property {number} id ERC-721 token ID, scoped to chain and contract.
 * @property {Genome} genes Public immutable allele pairs.
 * @property {number} species Expressed variety: 0–3 natural, 4 prismatic, 5 monochrome.
 * @property {number} fur
 * @property {number} mane
 * @property {number} eyes
 * @property {number} pattern
 * @property {number} temperament
 * @property {number} aura
 * @property {number} crown
 * @property {number} rarity Expressed traits only; hidden alleles do not raise it.
 * @property {number} generation max(parent generations) + 1; zero for founders.
 * @property {number} parentA Zero means no parent.
 * @property {number} parentB Zero means no parent.
 * @property {number} bornAt Unix seconds, not JavaScript milliseconds.
 * @property {number} nextBreedAt Unix seconds.
 * @property {string} owner Address or the demo owner sentinel.
 * @property {string} dna Decimal uint256 birth seed; never convert to Number.
 * @property {number} geneticsVersion
 * @property {string} [geneticsOrigin] Set for explicit legacy migrations only.
 *
 * @typedef {object} FamilyRepository
 * @property {(id: number) => Promise<Lion>} getLion
 * @property {(id: number, offset: number, limit: number) => Promise<{ids: number[], total: number}>} getChildren
 */
export {};
