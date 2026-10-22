const assert = require("node:assert/strict");
const { ethers } = require("hardhat");

describe("Versioned genetics parity and rarity limits", function () {
  let harness, model, demo;
  before(async function () {
    harness = await (await ethers.getContractFactory("LionHarness")).deploy();
    await harness.waitForDeployment();
    model = await import("../src/domain/genetics.js");
    demo = await import("../src/domain/demo.js");
  });

  it("matches every allele and expression between JavaScript and Solidity founders", async function () {
    for (const seed of [0, 1, 2, 3, 7, 27, 42, 624, 999, 10000, 99999, 2n ** 255n]) {
      const result = await harness.founder(seed),
        expected = model.founderGenome(seed);
      assert.deepEqual(Array.from(result.genes, Number), expected.genes);
      assert.equal(Number(result.spectrum), model.spectrumOf(expected));
    }
  });

  it("matches inherited hidden genes, mutation and spectrum decisions for ordinary and rare pairings", async function () {
    const fixtures = demo.initialDemo();
    const blackWhite = {
      ...fixtures[4],
      species: 5,
      genes: [...fixtures[4].genes.slice(0, 16), 2, 2],
    };
    for (const [a, b] of [
      [fixtures[0], fixtures[1]],
      [fixtures[4], fixtures[4]],
      [blackWhite, blackWhite],
    ]) {
      for (const seed of [0, 1, 5, 23, 27, 67, 538, 888, 3594, 9213]) {
        const result = await harness.inheritGenes(
          a.genes,
          b.genes,
          a.species,
          b.species,
          seed,
        );
        const expected = model.breedGenome(a, b, seed);
        assert.deepEqual(Array.from(result.genes, Number), expected.genes);
        assert.equal(Number(result.spectrum), model.spectrumOf(expected));
      }
    }
  });

  it("produces rare births and records spontaneous spectrum awakenings as inheritable genes", async function () {
    // Fixed protocol vectors exercise rare branches without flaky random sampling.
    for (const [seed, spectrum] of [
      [27, 1],
      [624, 2],
    ]) {
      const founder = await harness.founder(seed);
      assert.equal(founder.spectrum, BigInt(spectrum));
      assert.equal(model.spectrumOf(model.founderGenome(seed)), spectrum);
      assert.deepEqual(Array.from(founder.genes.slice(16), Number), [spectrum, spectrum]);
    }
    const natural = { species: 0, genes: Array(18).fill(0) };
    const colorful = { species: 4, genes: [...Array(16).fill(0), 1, 1] };
    for (const [parent, seed, spectrum] of [
      [natural, 538, 1],
      [colorful, 0, 0],
      [colorful, 27, 1],
      [colorful, 3594, 2],
    ]) {
      const result = await harness.inheritGenes(
        parent.genes,
        parent.genes,
        parent.species,
        parent.species,
        seed,
      );
      const expected = model.breedGenome(parent, parent, seed);
      assert.equal(result.spectrum, BigInt(spectrum));
      assert.equal(model.spectrumOf(expected), spectrum);
      assert.deepEqual(Array.from(result.genes, Number), expected.genes);
      if (spectrum)
        assert(result.genes.slice(16).some((allele) => allele >= BigInt(spectrum)));
    }
  });

  it("never gives spectrum parents more than a 6% expression chance", async function () {
    for (const speciesA of [0, 4, 5])
      for (const speciesB of [0, 4, 5]) {
        const a = { species: speciesA, genes: Array(18).fill(0) },
          b = { species: speciesB, genes: Array(18).fill(0) };
        a.genes[16] = Math.max(0, speciesA - 3);
        b.genes[16] = Math.max(0, speciesB - 3);
        const [threshold, mono] = await harness.thresholds(
          a.genes,
          b.genes,
          speciesA,
          speciesB,
        );
        const chance = model.spectrumChances(a, b);
        assert(threshold <= 600n);
        assert.equal(Number(threshold) / 10000, chance.total);
        assert(
          Math.abs(
            ((Number(threshold) / 10000) * Number(mono)) / 1000 - chance.monochrome,
          ) < 1e-12,
        );
      }
    const genes = Array(18).fill(0);
    genes[16] = genes[17] = 2;
    assert.deepEqual(Array.from(await harness.thresholds(genes, genes, 5, 5)), [
      600n,
      10n,
    ]);
  });

  it("preserves catalog draw boundaries, including rare eyes and monochrome predisposition", async function () {
    for (let locus = 0; locus < model.LOCI.length; locus++) {
      const weights = model.LOCI[locus].weights;
      let start = 0;
      for (let allele = 0; allele < weights.length; allele++) {
        assert.equal(await harness.draw(locus, start), BigInt(allele));
        assert.equal(
          await harness.draw(locus, start + weights[allele] - 1),
          BigInt(allele),
        );
        start += weights[allele];
      }
      assert.equal(await harness.draw(locus, start), 0n);
    }
  });

  it("gives monochrome its own on-chain eclipse and monochrome shader", async function () {
    const monochrome = await harness.art(5, 8, 6, 0),
      rainbow = await harness.art(4, 8, 6, 0);
    assert(monochrome.includes('fill="url(#mono)"'));
    assert(monochrome.includes('cx="150" cy="30" r="19"'));
    assert.notEqual(monochrome, rainbow);
  });
});
