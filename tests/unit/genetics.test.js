import test from "node:test";
import assert from "node:assert/strict";
import {
  founderGenome,
  breedGenome,
  offspringDistribution,
  expressGenes,
  spectrumChances,
  LOCI,
  isGenome,
} from "../../src/domain/genetics.js";
import { initialDemo } from "../../src/domain/demo.js";

function parent(species = 0, spectrumAllele = 0) {
  const lion = { ...initialDemo()[1], species, genes: Array(18).fill(0) };
  lion.genes[16] = lion.genes[17] = spectrumAllele;
  return lion;
}

test("two recessive carriers can express a rare ordinary trait; hidden genes do not paint the parent", () => {
  const a = parent(),
    b = parent();
  a.genes[6] = b.genes[6] = 0;
  a.genes[7] = b.genes[7] = 6;
  assert.equal(expressGenes(a.genes).eyes, 0);
  const distribution = offspringDistribution(a, b, 3);
  assert(distribution[6] > 0.2 && distribution[6] < 0.25);
  assert(Math.abs(distribution.reduce((x, y) => x + y, 0) - 1) < 1e-12);
});

test("spectrum inheritance is capped even when both parents carry two rare alleles", () => {
  const normal = spectrumChances(parent(), parent());
  const colorful = spectrumChances(parent(4, 1), parent(4, 1));
  const monochrome = spectrumChances(parent(5, 2), parent(5, 2));
  assert.equal(normal.total, 0.001);
  assert.equal(colorful.total, 0.06);
  assert.equal(colorful.regular, 0.94);
  assert(Math.abs(colorful.monochrome - 0.00006) < 1e-12);
  assert.equal(monochrome.total, 0.06);
  assert(Math.abs(monochrome.monochrome - 0.0006) < 1e-12);
  assert(colorful.total > normal.total);
});

test("ordinary carriers receive small bonuses without guaranteed spectrum appearance", () => {
  assert.equal(spectrumChances(parent(0, 1), parent()).total, 0.005);
  assert.equal(spectrumChances(parent(0, 1), parent(0, 1)).total, 0.01);
  assert.equal(spectrumChances(parent(4, 1), parent()).total, 0.03);
});

test("births are reproducible, valid, and do not mutate parental genomes", () => {
  const a = initialDemo()[0],
    b = initialDemo()[1];
  const before = JSON.stringify([a, b]);
  for (let seed = 0; seed < 64; seed++) {
    const founder = founderGenome(seed),
      child = breedGenome(a, b, seed);
    assert(isGenome(founder.genes));
    assert(isGenome(child.genes));
    assert.deepEqual(child, breedGenome(a, b, seed));
    LOCI.slice(0, 8).forEach((locus, index) => {
      if (locus.key !== "species" || child.species < 4)
        assert.equal(
          child[locus.key],
          Math.min(...child.genes.slice(index * 2, index * 2 + 2)),
        );
    });
  }
  assert.equal(JSON.stringify([a, b]), before);
});

test("published ordinary-locus forecasts sum to one for every locus", () => {
  const [a, b] = initialDemo();
  for (let locus = 0; locus < 8; locus++) {
    const distribution = offspringDistribution(a, b, locus);
    assert(distribution.every((value) => value >= 0));
    assert(Math.abs(distribution.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
  }
});
