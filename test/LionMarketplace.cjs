const assert = require("node:assert/strict");
const { ethers } = require("hardhat");

describe("LionMarketplace", function () {
  let nft, market, alice, bob, other, actor;
  const price = ethers.parseEther("0.01");
  async function list(id = 1) {
    await (await nft.mint()).wait();
    await (await nft.approve(await market.getAddress(), id)).wait();
    await (await market.list(id, price)).wait();
  }
  beforeEach(async function () {
    [alice, bob, other] = await ethers.getSigners();
    nft = await (await ethers.getContractFactory("LionNFT")).deploy();
    await nft.waitForDeployment();
    market = await (
      await ethers.getContractFactory("LionMarketplace")
    ).deploy(await nft.getAddress());
    await market.waitForDeployment();
    actor = await (
      await ethers.getContractFactory("MarketActor")
    ).deploy(await nft.getAddress(), await market.getAddress());
    await actor.waitForDeployment();
  });
  it("binds to one collection and requires ownership, approval and positive prices", async function () {
    await assert.rejects(
      (await ethers.getContractFactory("LionMarketplace")).deploy(alice.address),
      /InvalidCollection/,
    );
    assert.equal(await market.nft(), await nft.getAddress());
    await (await nft.mint()).wait();
    await assert.rejects(market.list(1, 0), /InvalidPrice/);
    await assert.rejects(market.connect(bob).list(1, price), /NotOwner/);
    await assert.rejects(market.list(1, price), /ERC721InsufficientApproval/);
    assert.equal((await market.listings(1)).seller, ethers.ZeroAddress);
    assert.equal(await nft.ownerOf(1), alice.address);
    await (await nft.approve(await market.getAddress(), 1)).wait();
    await (await market.list(1, price)).wait();
    assert.equal(await nft.ownerOf(1), await market.getAddress());
    assert.equal((await market.listings(1)).price, price);
  });
  it("returns escrowed NFTs only to the seller and preserves all traits", async function () {
    await list();
    const before = Array.from(await nft.getLion(1));
    await assert.rejects(market.connect(bob).cancel(1), /NotSeller/);
    await assert.rejects(
      nft.transferFrom(alice.address, bob.address, 1),
      /ERC721InsufficientApproval/,
    );
    await (await market.cancel(1)).wait();
    assert.equal(await nft.ownerOf(1), alice.address);
    assert.deepEqual(Array.from(await nft.getLion(1)), before);
    assert.equal((await market.listings(1)).seller, ethers.ZeroAddress);
    await assert.rejects(market.cancel(1), /NotListed/);
  });
  it("settles exact ETH atomically and records token, seller, buyer and price", async function () {
    await list();
    await assert.rejects(market.buy(1, { value: price }), /SelfPurchase/);
    await assert.rejects(
      market.connect(bob).buy(1, { value: price - 1n }),
      /WrongPayment/,
    );
    await assert.rejects(
      market.connect(bob).buy(1, { value: price + 1n }),
      /WrongPayment/,
    );
    const receipt = await (await market.connect(bob).buy(1, { value: price })).wait();
    const sale = receipt.logs
      .map((log) => {
        try {
          return market.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "Sale");
    assert.equal(sale.args.tokenId, 1n);
    assert.equal(sale.args.seller, alice.address);
    assert.equal(sale.args.buyer, bob.address);
    assert.equal(sale.args.price, price);
    assert.equal(await nft.ownerOf(1), bob.address);
    assert.equal(await market.proceeds(alice.address), price);
    assert.equal((await market.listings(1)).seller, ethers.ZeroAddress);
    await assert.rejects(market.connect(other).buy(1, { value: price }), /NotListed/);
    await assert.rejects(market.cancel(1), /NotListed/);
  });
  it("withdraws only the caller's proceeds once, with balances conserved", async function () {
    await list();
    await (await market.connect(bob).buy(1, { value: price })).wait();
    await assert.rejects(market.connect(bob).withdraw(), /NoProceeds/);
    const before = await ethers.provider.getBalance(alice.address);
    const receipt = await (await market.withdraw()).wait();
    const after = await ethers.provider.getBalance(alice.address);
    assert.equal(after - before, price - receipt.gasUsed * receipt.gasPrice);
    assert.equal(await market.proceeds(alice.address), 0n);
    assert.equal(await ethers.provider.getBalance(await market.getAddress()), 0n);
    await assert.rejects(market.withdraw(), /NoProceeds/);
  });
  it("rolls back payment, listing deletion and credits if the buyer rejects the NFT", async function () {
    await list();
    await (await actor.configure(true, false, false)).wait();
    await assert.rejects(actor.buy(1, { value: price }), /Reject NFT/);
    assert.equal(await nft.ownerOf(1), await market.getAddress());
    assert.equal((await market.listings(1)).seller, alice.address);
    assert.equal(await market.proceeds(alice.address), 0n);
    assert.equal(await ethers.provider.getBalance(await market.getAddress()), 0n);
  });
  it("preserves rejected withdrawals and blocks reentry without touching another seller's credit", async function () {
    await list();
    await (await market.connect(bob).buy(1, { value: price })).wait();
    await (await actor.mintAndList(price)).wait();
    await (await actor.configure(false, true, false)).wait();
    await (await market.connect(bob).buy(2, { value: price })).wait();
    await assert.rejects(actor.withdraw(), /PaymentFailed/);
    assert.equal(await market.proceeds(await actor.getAddress()), price);
    await (await actor.configure(false, false, true)).wait();
    await (await actor.withdraw()).wait();
    assert.equal(await actor.reentryBlocked(), true);
    assert.equal(await market.proceeds(await actor.getAddress()), 0n);
    assert.equal(await market.proceeds(alice.address), price);
    assert.equal(await ethers.provider.getBalance(await market.getAddress()), price);
    assert.equal(await ethers.provider.getBalance(await actor.getAddress()), price);
  });
  it("rejects unsolicited safe deposits and forged receiver callbacks", async function () {
    await (await nft.mint()).wait();
    await assert.rejects(
      nft["safeTransferFrom(address,address,uint256)"](
        alice.address,
        await market.getAddress(),
        1,
      ),
      /DirectDeposit/,
    );
    await assert.rejects(
      market.onERC721Received(alice.address, alice.address, 1, "0x"),
      /DirectDeposit/,
    );
    assert.equal(await nft.ownerOf(1), alice.address);
  });
});
