const fs = require("node:fs");
const hre = require("hardhat");
const updateEnv = require("./env.cjs");

async function deployMarket(address) {
  const factory = await hre.ethers.getContractFactory("LionMarketplace");
  const request = await factory.getDeployTransaction(address);
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("Configure a deployment wallet first.");
  const estimate = await hre.ethers.provider.estimateGas({
    from: deployer.address,
    data: request.data,
  });
  const market = await factory.deploy(address, { gasLimit: (estimate * 120n) / 100n });
  await market.waitForDeployment();
  return {
    marketAddress: await market.getAddress(),
    marketTransactionHash: market.deploymentTransaction().hash,
  };
}

async function main() {
  const address = process.env.VITE_CONTRACT_ADDRESS;
  if (
    !hre.ethers.isAddress(address || "") ||
    (await hre.ethers.provider.getCode(address)) === "0x"
  )
    throw new Error(
      "Deploy LionNFT first, then run market deployment on the same network.",
    );
  const { chainId } = await hre.ethers.provider.getNetwork();
  if (Number(process.env.VITE_CHAIN_ID) !== Number(chainId))
    throw new Error("VITE_CHAIN_ID does not match the selected deployment network.");
  const file = `deployments/${chainId}.json`;
  const previous = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : { address, chainId: Number(chainId) };
  if (previous.address.toLowerCase() !== address.toLowerCase())
    throw new Error("Deployment record and frontend NFT address differ.");
  const result = await deployMarket(address);
  if (previous.marketAddress)
    fs.copyFileSync(file, `deployments/${chainId}-market-${previous.marketAddress}.json`);
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ ...previous, ...result }, null, 2) + "\n");
  updateEnv({ VITE_MARKET_ADDRESS: result.marketAddress });
  console.log(
    `LionMarketplace deployed: ${result.marketAddress}; existing LionNFT preserved: ${address}`,
  );
}

module.exports = { deployMarket };
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
