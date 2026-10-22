const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer)
    throw new Error("Set DEPLOYER_PRIVATE_KEY in .env.local for Sepolia deployment.");
  const factory = await hre.ethers.getContractFactory("LionNFT");
  const request = await factory.getDeployTransaction();
  const estimate = BigInt(
    await hre.network.provider.send("eth_estimateGas", [
      { from: deployer.address, data: request.data },
    ]),
  );
  const contract = await factory.deploy({ gasLimit: (estimate * 120n) / 100n });
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const { chainId } = await hre.ethers.provider.getNetwork();
  fs.mkdirSync("deployments", { recursive: true });
  const previousPath = path.join("deployments", `${chainId}.json`);
  if (fs.existsSync(previousPath)) {
    const previous = JSON.parse(fs.readFileSync(previousPath, "utf8"));
    if (hre.ethers.isAddress(previous.address)) {
      fs.copyFileSync(
        previousPath,
        path.join("deployments", `${chainId}-${previous.address}.json`),
      );
    }
  }
  fs.writeFileSync(
    path.join("deployments", `${chainId}.json`),
    JSON.stringify(
      {
        address,
        geneticsVersion: Number(await contract.GENETICS_VERSION()),
        chainId: Number(chainId),
        deployer: deployer.address,
        transactionHash: contract.deploymentTransaction().hash,
      },
      null,
      2,
    ) + "\n",
  );
  // Keep secrets intact; update only frontend connection settings.
  const envPath = ".env.local";
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const settings = {
    VITE_CONTRACT_ADDRESS: address,
    VITE_CHAIN_ID: String(chainId),
    VITE_RPC_URL:
      chainId === 31337n
        ? "http://127.0.0.1:8545"
        : process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
  };
  for (const [key, value] of Object.entries(settings)) {
    const line = new RegExp(`^${key}=.*$`, "m");
    env = line.test(env)
      ? env.replace(line, () => `${key}=${value}`)
      : `${env.trimEnd()}\n${key}=${value}\n`;
  }
  fs.writeFileSync(envPath, env.trimStart());
  console.log(`LionNFT deployed: ${address} (chain ${chainId})`);
  console.log("Updated .env.local. Restart the frontend to use the deployed contract.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
