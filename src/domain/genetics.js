import { AbiCoder, keccak256 } from "ethers";
import spec from "../../shared/genetics.json" with { type: "json" };

export const GENETICS_VERSION = spec.version;
export const LOCI = spec.loci;
export const GENE_COUNT = LOCI.length * 2;
export const SPECTRUM_LOCUS = 8;
export const MUTATION_RATE = 1 / spec.mutationDenominator;
const coder = AbiCoder.defaultAbiCoder();

/** @typedef {number[]} Genome Ordered allele pairs; indexes must never be reordered. */

/** Domain-separated draws match Solidity's abi.encode(uint256,uint256,uint256). */
export function randomWord(seed, domain, locus) {
  return BigInt(
    keccak256(coder.encode(["uint256", "uint256", "uint256"], [seed, domain, locus])),
  );
}

export function drawAllele(locus, word) {
  const weights = LOCI[locus].weights;
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Number(BigInt(word) % BigInt(total));
  for (let allele = 0; allele < weights.length; allele++) {
    if (roll < weights[allele]) return allele;
    roll -= weights[allele];
  }
  throw new RangeError("Invalid allele draw");
}

export function isGenome(genes) {
  return (
    Array.isArray(genes) &&
    genes.length === GENE_COUNT &&
    genes.every(
      (value, index) =>
        Number.isInteger(value) &&
        value >= 0 &&
        value < LOCI[Math.floor(index / 2)].names.length,
    )
  );
}

/** Lower catalog indexes dominate at ordinary loci. Spectrum uses a separate gate. */
export function expressGenes(genes, spectrum = 0) {
  if (!isGenome(genes)) throw new TypeError("Invalid genome");
  const phenotype = Object.fromEntries(
    LOCI.slice(0, SPECTRUM_LOCUS).map(({ key }, i) => [
      key,
      Math.min(genes[i * 2], genes[i * 2 + 1]),
    ]),
  );
  if (spectrum) phenotype.species = spectrum === 2 ? 5 : 4;
  return phenotype;
}

export function spectrumOf(lion) {
  return lion.species >= 4 ? lion.species - 3 : 0;
}
export function carriesSpectrum(lion, allele = 1) {
  return lion.genes.slice(SPECTRUM_LOCUS * 2).some((value) => value >= allele);
}

/** Returns exact rates for the spectrum gate, not a Mendelian carrier guarantee. */
export function spectrumChances(parentA, parentB) {
  const rules = spec.spectrum;
  const expressed = Number(spectrumOf(parentA) > 0) + Number(spectrumOf(parentB) > 0);
  const carriers = Number(carriesSpectrum(parentA)) + Number(carriesSpectrum(parentB));
  const threshold =
    expressed === 2
      ? rules.breeding.twoExpressed
      : expressed === 1
        ? rules.breeding.oneExpressed
        : carriers === 2
          ? rules.breeding.twoCarriers
          : carriers === 1
            ? rules.breeding.oneCarrier
            : rules.breeding.noCarrier;
  const monochrome = Number(parentA.species === 5) + Number(parentB.species === 5);
  const monoThreshold =
    monochrome === 2
      ? rules.monochrome.twoExpressed
      : monochrome === 1
        ? rules.monochrome.oneExpressed
        : carriesSpectrum(parentA, 2) || carriesSpectrum(parentB, 2)
          ? rules.monochrome.carrier
          : rules.monochrome.normal;
  const total = threshold / rules.denominator;
  const blackWhite = (total * monoThreshold) / rules.monochrome.denominator;
  return {
    total,
    prismatic: total - blackWhite,
    monochrome: blackWhite,
    regular: 1 - total,
  };
}

/** Preserve published Gen 0 visible frequencies while adding non-visible alleles. */
export function founderGenome(seed) {
  const genes = [];
  LOCI.forEach((_, i) => {
    const visible = i === SPECTRUM_LOCUS ? 0 : drawAllele(i, randomWord(seed, 0, i));
    genes.push(visible, Math.max(visible, drawAllele(i, randomWord(seed, 1, i))));
  });
  const roll = Number(randomWord(seed, 20, 0) % BigInt(spec.spectrum.denominator));
  const spectrum =
    roll < spec.spectrum.founderMonochrome
      ? 2
      : roll < spec.spectrum.founderPrismatic
        ? 1
        : 0;
  if (spectrum) genes[16] = genes[17] = spectrum;
  return { genes, ...expressGenes(genes, spectrum) };
}

/** One allele from each parent, then at most one mutation per locus (1/8). */
export function breedGenome(parentA, parentB, seed) {
  const genes = [];
  LOCI.forEach((_, i) => {
    const a = Number(randomWord(seed, 2, i) % 2n);
    const b = Number(randomWord(seed, 3, i) % 2n);
    genes.push(parentA.genes[i * 2 + a], parentB.genes[i * 2 + b]);
    if (randomWord(seed, 4, i) % BigInt(spec.mutationDenominator) === 0n) {
      genes[i * 2 + Number(randomWord(seed, 5, i) % 2n)] = drawAllele(
        i,
        randomWord(seed, 6, i),
      );
    }
  });
  const chance = spectrumChances(parentA, parentB);
  const hit =
    Number(randomWord(seed, 20, 0) % BigInt(spec.spectrum.denominator)) <
    Math.round(chance.total * spec.spectrum.denominator);
  const monoThreshold = Math.round(
    (chance.monochrome / chance.total) * spec.spectrum.monochrome.denominator,
  );
  const spectrum = hit
    ? Number(randomWord(seed, 21, 0) % BigInt(spec.spectrum.monochrome.denominator)) <
      monoThreshold
      ? 2
      : 1
    : 0;
  // Awakening records its predisposition even when neither transmitted allele carried it.
  if (spectrum) genes[16] = Math.max(genes[16], spectrum);
  return { genes, ...expressGenes(genes, spectrum) };
}

/** Complete visible distribution including the single-allele mutation branch. */
export function offspringDistribution(parentA, parentB, locus) {
  if (locus === SPECTRUM_LOCUS) return spectrumChances(parentA, parentB);
  const weights = LOCI[locus].weights;
  const sum = weights.reduce((a, b) => a + b, 0);
  const outcomes = Array(weights.length).fill(0);
  for (const a of parentA.genes.slice(locus * 2, locus * 2 + 2)) {
    for (const b of parentB.genes.slice(locus * 2, locus * 2 + 2)) {
      outcomes[Math.min(a, b)] += (1 - MUTATION_RATE) / 4;
      weights.forEach((weight, value) => {
        const chance = ((MUTATION_RATE / 8) * weight) / sum;
        outcomes[Math.min(value, b)] += chance;
        outcomes[Math.min(a, value)] += chance;
      });
    }
  }
  return outcomes;
}

/** Old snapshots cannot reveal historical hidden genes; homozygous migration is explicit. */
export function legacyGenome(lion) {
  return LOCI.flatMap(({ key }, i) => {
    const value =
      i === SPECTRUM_LOCUS
        ? spectrumOf(lion)
        : key === "species" && lion.species >= 4
          ? 0
          : lion[key];
    return [value, value];
  });
}
