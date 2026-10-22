require("dotenv").config({ path: ".env.local", quiet: true });
require("dotenv").config({ quiet: true });
require("@nomicfoundation/hardhat-ethers");
const { subtask } = require("hardhat/config");
const {
  TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
} = require("hardhat/builtin-tasks/task-names");

// Use the pinned local compiler so compilation needs no Solidity binary download.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(
  async ({ solcVersion }, _, runSuper) => {
    if (solcVersion === "0.8.28")
      return {
        compilerPath: require.resolve("solc/soljson.js"),
        isSolcJs: true,
        version: solcVersion,
        longVersion: require("solc").version(),
      };
    return runSuper();
  },
);

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: { viaIR: true, optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    localhost: { url: "http://127.0.0.1:8545" },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      chainId: 11155111,
    },
  },
};
