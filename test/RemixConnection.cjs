const assert = require("node:assert/strict");
const { ethers } = require("hardhat");

describe("Remix deployment connection validation", function () {
  it("checks network, deployed code and the NFT-market pair before accepting addresses", async function () {
    const { validateDeployment } = await import("../scripts/connect-remix.mjs");
    const [alice] = await ethers.getSigners();
    const nft = await (await ethers.getContractFactory("LionNFT")).deploy();
    const otherNft = await (await ethers.getContractFactory("LionNFT")).deploy();
    await Promise.all([nft.waitForDeployment(), otherNft.waitForDeployment()]);
    const address = await nft.getAddress();
    const market = await (
      await ethers.getContractFactory("LionMarketplace")
    ).deploy(address);
    await market.waitForDeployment();
    const marketAddress = await market.getAddress();
    await assert.rejects(
      validateDeployment(ethers.provider, address, marketAddress),
      /Expected chain 11155111/,
    );
    await assert.rejects(
      validateDeployment(ethers.provider, address, alice.address, 31337),
      /deployed contracts/,
    );
    await assert.rejects(
      validateDeployment(
        ethers.provider,
        await otherNft.getAddress(),
        marketAddress,
        31337,
      ),
      /different NFT/,
    );
    await assert.rejects(
      validateDeployment(ethers.provider, ethers.ZeroAddress, marketAddress, 31337),
      /nonzero/,
    );
    const record = await validateDeployment(
      ethers.provider,
      address,
      marketAddress,
      31337,
    );
    assert.equal(record.address, address);
    assert.equal(record.marketAddress, marketAddress);
    assert.equal(record.totalMinted, "0");
    assert.equal(record.activeSupply, "0");
  });
});
