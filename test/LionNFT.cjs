const assert = require("node:assert/strict");
const { ethers, network } = require("hardhat");

describe("LionNFT", function () {
  let nft, alice, bob;
  beforeEach(async function () {
    [alice, bob] = await ethers.getSigners();
    nft = await (await ethers.getContractFactory("LionNFT")).deploy();
    await nft.waitForDeployment();
  });
  async function mint(signer = alice) {
    await (await nft.connect(signer).mint()).wait();
  }
  async function rest() {
    await network.provider.send("evm_increaseTime", [301]);
    await network.provider.send("evm_mine");
  }

  it("mints unique ERC-721 identities, emits a birth, and enumerates ownership", async function () {
    const receipt = await (await nft.mint()).wait();
    const born = receipt.logs
      .map((l) => {
        try {
          return nft.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((l) => l?.name === "LionBorn");
    assert.equal(born.args.owner, alice.address);
    assert.equal(born.args.tokenId, 1n);
    await mint();
    assert.equal(await nft.ownerOf(1), alice.address);
    assert.equal(await nft.totalSupply(), 2n);
    assert.equal(await nft.balanceOf(alice.address), 2n);
    assert.equal(await nft.tokenOfOwnerByIndex(alice.address, 1), 2n);
    assert.notEqual((await nft.getLion(1)).dna, (await nft.getLion(2)).dna);
    assert.equal(await nft.supportsInterface("0x80ac58cd"), true);
    assert.equal(await nft.supportsInterface("0x780e9d63"), true);
  });

  it("keeps all eight genes in range and derives rarity from actual traits", async function () {
    for (let i = 1; i <= 40; i++) {
      await mint();
      const l = await nft.getLion(i);
      for (const [key, max] of Object.entries({
        species: 6,
        fur: 6,
        mane: 9,
        eyes: 7,
        pattern: 6,
        temperament: 6,
        aura: 4,
        crown: 4,
      })) {
        assert(l[key] >= 0n && l[key] < BigInt(max), `${key} out of range`);
      }
      assert.equal(l.generation, 0n);
      assert.equal(l.parentA, 0n);
      assert.equal(l.parentB, 0n);
      const legendary =
        l.species >= 4n || l.mane === 8n || l.eyes === 6n || l.crown === 3n;
      assert.equal(l.rarity === 3n, legendary);
      assert(l.species !== 3n || l.rarity >= 2n);
      assert(l.species !== 2n || l.rarity >= 1n);
    }
  });

  it("returns self-contained JSON, SVG, and all gene metadata", async function () {
    await mint();
    const uri = await nft.tokenURI(1);
    assert(uri.startsWith("data:application/json;base64,"));
    const metadata = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString());
    assert.equal(metadata.name, "Lion #1");
    assert.equal(metadata.attributes.length, 12);
    assert.equal(metadata.genetics_version, 2);
    assert.equal(metadata.genes.length, 18);
    assert.deepEqual(metadata.genes, Array.from(await nft.getGenes(1), Number));
    const svg = Buffer.from(metadata.image.split(",")[1], "base64").toString();
    assert(svg.startsWith("<svg"));
    assert(svg.endsWith("</svg>"));
    const lion = await nft.getLion(1);
    assert.equal(
      metadata.attributes.find((a) => a.trait_type === "Species").value,
      Number(lion.species),
    );
    assert.equal(
      metadata.attributes.find((a) => a.trait_type === "Crown").value,
      Number(lion.crown),
    );
    await assert.rejects(nft.tokenURI(999), /ERC721NonexistentToken/);
    await assert.rejects(nft.getLion(999), /ERC721NonexistentToken/);
  });

  it("prevents unauthorized transfer and preserves immutable genes after transfer", async function () {
    await mint();
    const before = await nft.getLion(1);
    const genesBefore = Array.from(await nft.getGenes(1));
    await assert.rejects(
      nft.connect(bob).transferFrom(alice.address, bob.address, 1),
      /ERC721InsufficientApproval/,
    );
    await (
      await nft["safeTransferFrom(address,address,uint256)"](
        alice.address,
        bob.address,
        1,
      )
    ).wait();
    assert.equal(await nft.ownerOf(1), bob.address);
    assert.equal(await nft.balanceOf(alice.address), 0n);
    assert.equal(await nft.tokenOfOwnerByIndex(bob.address, 0), 1n);
    assert.deepEqual(Array.from(await nft.getLion(1)), Array.from(before));
    assert.deepEqual(Array.from(await nft.getGenes(1)), genesBefore);
  });

  it("rejects identical parents, foreign parents, newborns, and reused resting parents", async function () {
    await mint();
    await mint();
    await mint(bob);
    await assert.rejects(nft.breed(1, 1), /SameParent/);
    await assert.rejects(nft.breed(1, 3), /NotParentOwner/);
    await assert.rejects(nft.breed(1, 2), /ParentResting/);
    await rest();
    await (await nft.breed(1, 2)).wait();
    assert.equal(await nft.totalSupply(), 4n);
    const child = await nft.getLion(4);
    assert.equal(child.parentA, 1n);
    assert.equal(child.parentB, 2n);
    assert.equal(child.generation, 1n);
    assert.equal(await nft.ownerOf(4), alice.address);
    assert.equal(await nft.nextBreedAt(1), await nft.nextBreedAt(2));
    await assert.rejects(nft.breed(1, 2), /ParentResting/);
    await rest();
    await (await nft.breed(1, 4)).wait();
    assert.equal((await nft.getLion(5)).generation, 2n);
  });

  it("requires both parents to remain owned by the breeding wallet", async function () {
    await mint();
    await mint();
    await rest();
    await (await nft.transferFrom(alice.address, bob.address, 2)).wait();
    await assert.rejects(nft.breed(1, 2), /NotParentOwner/);
    await assert.rejects(nft.connect(bob).breed(1, 2), /NotParentOwner/);
  });
  it("indexes both parents, paginates direct children and preserves lineage across transfers", async function () {
    await mint();
    await mint();
    await rest();
    await (await nft.breed(1, 2)).wait();
    await rest();
    await (await nft.breed(1, 3)).wait();
    assert.equal(await nft.GENETICS_VERSION(), 2n);
    assert.equal(await nft.childCount(1), 2n);
    assert.deepEqual(Array.from(await nft.childrenOf(1, 0, 1)), [3n]);
    assert.deepEqual(Array.from(await nft.childrenOf(1, 1, 1)), [4n]);
    assert.deepEqual(Array.from(await nft.childrenOf(1, 50, 6)), []);
    assert.deepEqual(Array.from(await nft.childrenOf(2, 0, 6)), [3n]);
    await (await nft.transferFrom(alice.address, bob.address, 1)).wait();
    assert.deepEqual(Array.from(await nft.childrenOf(1, 0, 6)), [3n, 4n]);
    assert.equal((await nft.getLion(4)).parentA, 1n);
    await assert.rejects(nft.childrenOf(1, 0, 0), /InvalidPageSize/);
    await assert.rejects(nft.childrenOf(1, 0, 25), /InvalidPageSize/);
    await assert.rejects(nft.getGenes(999), /ERC721NonexistentToken/);
    await assert.rejects(nft.childCount(999), /ERC721NonexistentToken/);
  });
});
