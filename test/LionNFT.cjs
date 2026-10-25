const assert = require("node:assert/strict");
const { ethers, network } = require("hardhat");

describe("Simple Lionverse", function () {
  let nft, harness, alice, bob;
  const traits = (lion) => ["species", "fur", "mane", "eyes"].map((key) => lion[key]);
  const rest = async () => {
    await network.provider.send("evm_increaseTime", [301]);
    await network.provider.send("evm_mine");
  };
  const mint = async (who) => {
    await (await nft.connect(who || alice).mint()).wait();
  };
  beforeEach(async function () {
    [alice, bob] = await ethers.getSigners();
    nft = await (await ethers.getContractFactory("LionNFT")).deploy();
    harness = await (await ethers.getContractFactory("LionHarness")).deploy();
    await Promise.all([nft.waitForDeployment(), harness.waitForDeployment()]);
  });

  it("uses exact 60% natural / 30% monochrome / 10% rainbow gate boundaries", async function () {
    for (const roll of [0, 1, 5999]) assert((await harness.species(roll, 0)) < 4n);
    for (const roll of [6000, 6001, 8999])
      assert.equal(await harness.species(roll, 0), 5n);
    for (const roll of [9000, 9001, 9999])
      assert.equal(await harness.species(roll, 0), 4n);
    assert.equal(await harness.species(10000, 0), 0n);
    for (const [roll, expected] of [
      [0, 0],
      [6199, 0],
      [6200, 1],
      [8599, 1],
      [8600, 2],
      [9499, 2],
      [9500, 3],
      [9849, 3],
    ]) {
      assert.equal(await harness.species(0, roll), BigInt(expected));
    }
  });

  it("generates four valid traits and inherits only a parent's visible values", async function () {
    const seen = Array.from({ length: 4 }, () => new Set());
    const a = [0, 0, 0, 0],
      b = [5, 5, 2, 3];
    for (let seed = 0; seed < 32; seed++) {
      const founder = await harness.founder(seed);
      for (const [i, max] of [6, 6, 3, 4].entries())
        assert(founder[i] >= 0n && founder[i] < BigInt(max));
      const child = await harness.inheritTraits(a, b, seed);
      child.forEach((v, i) => {
        assert([BigInt(a[i]), BigInt(b[i])].includes(v));
        seen[i].add(v);
      });
    }
    seen.forEach((values) => assert.equal(values.size, 2));
    assert.deepEqual(Array.from(await harness.inheritTraits(b, b, 42)), b.map(BigInt));
  });

  it("mints ERC-721 identities and enumerates their owner", async function () {
    await mint();
    await mint();
    assert.equal(await nft.totalSupply(), 2n);
    assert.equal(await nft.ownerOf(1), alice.address);
    assert.equal(await nft.balanceOf(alice.address), 2n);
    assert.equal(await nft.tokenOfOwnerByIndex(alice.address, 1), 2n);
    assert.equal(await nft.supportsInterface("0x80ac58cd"), true);
    const l = await nft.getLion(1);
    assert.equal(l.length, 8);
    assert.equal(l.generation, 0n);
    assert.equal(l.parentA, 0n);
    assert(l.bornAt > 0n);
  });

  it("keeps NFT metadata and the SVG self contained with four visible attributes", async function () {
    await mint();
    const metadata = JSON.parse(
      Buffer.from((await nft.tokenURI(1)).split(",")[1], "base64").toString(),
    );
    assert.equal(metadata.name, "Lion #1");
    assert.equal(metadata.attributes.length, 8);
    assert.deepEqual(
      metadata.attributes.slice(0, 4).map((x) => x.trait_type),
      ["Species", "Fur", "Mane", "Eyes"],
    );
    assert(!("genes" in metadata));
    const svg = Buffer.from(metadata.image.split(",")[1], "base64").toString();
    assert(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert(svg.endsWith("</svg>"));
    await assert.rejects(nft.getLion(999), /ERC721NonexistentToken/);
    await assert.rejects(nft.tokenURI(999), /ERC721NonexistentToken/);
  });

  it("enforces ownership and cooldown and records inherited traits and parent IDs", async function () {
    await mint();
    await mint();
    await mint(bob);
    await assert.rejects(nft.breed(1, 1), /SameParent/);
    await assert.rejects(nft.breed(1, 3), /NotParentOwner/);
    await assert.rejects(nft.breed(1, 2), /ParentResting/);
    await rest();
    const a = await nft.getLion(1),
      b = await nft.getLion(2);
    const receipt = await (await nft.breed(1, 2)).wait();
    const event = receipt.logs
      .map((log) => {
        try {
          return nft.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "LionBorn");
    assert.equal(event.args.tokenId, 4n);
    const child = await nft.getLion(4);
    traits(child).forEach((value, i) =>
      assert([traits(a)[i], traits(b)[i]].includes(value)),
    );
    assert.equal(child.parentA, 1n);
    assert.equal(child.parentB, 2n);
    assert.equal(child.generation, 1n);
    assert.equal(await nft.ownerOf(4), alice.address);
    await assert.rejects(nft.breed(1, 2), /ParentResting/);
    await rest();
    await (await nft.breed(1, 4)).wait();
    assert.equal((await nft.getLion(5)).generation, 2n);
  });

  it("transfers ownership without changing traits or ancestry", async function () {
    await mint();
    await mint();
    await rest();
    await (await nft.breed(1, 2)).wait();
    const before = Array.from(await nft.getLion(3));
    await assert.rejects(
      nft.connect(bob).transferFrom(alice.address, bob.address, 3),
      /ERC721InsufficientApproval/,
    );
    await (
      await nft["safeTransferFrom(address,address,uint256)"](
        alice.address,
        bob.address,
        3,
      )
    ).wait();
    assert.equal(await nft.ownerOf(3), bob.address);
    assert.deepEqual(Array.from(await nft.getLion(3)), before);
    await assert.rejects(nft.breed(1, 3), /NotParentOwner/);
    assert.equal(await nft.balanceOf(bob.address), 1n);
    await assert.rejects(
      nft.transferFrom(alice.address, ethers.ZeroAddress, 1),
      /ERC721InvalidReceiver/,
    );
  });
});
