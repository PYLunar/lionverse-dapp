import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { Contract, JsonRpcProvider, getAddress, isAddress, ZeroAddress } from "ethers";
import ABI from "../src/generated/LionNFT.abi.json" with { type: "json" };
import MARKET_ABI from "../src/generated/LionMarketplace.abi.json" with { type: "json" };
import updateEnv from "./env.cjs";

export async function validateDeployment(
  provider,
  nftAddress,
  marketAddress,
  chainId = 11155111,
) {
  if (
    ![nftAddress, marketAddress].every(
      (value) => isAddress(value) && value !== ZeroAddress,
    )
  )
    throw new Error("Provide valid nonzero NFT and market addresses from Remix.");
  const nft = getAddress(nftAddress),
    market = getAddress(marketAddress);
  if (nft === market) throw new Error("NFT and market addresses must be different.");
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(chainId))
    throw new Error(`Expected chain ${chainId}; the RPC is on chain ${network.chainId}.`);
  const blockTag = Number(await provider.send("eth_blockNumber", []));
  const [nftCode, marketCode] = await Promise.all([
    provider.getCode(nft, blockTag),
    provider.getCode(market, blockTag),
  ]);
  if (nftCode === "0x" || marketCode === "0x")
    throw new Error(
      "Both addresses must contain deployed contracts on the selected network.",
    );
  const c = new Contract(nft, ABI, provider),
    m = new Contract(market, MARKET_ABI, provider);
  const [name, symbol, erc721, cap, cooldown, minted, supply, boundNft] =
    await Promise.all([
      c.name({ blockTag }),
      c.symbol({ blockTag }),
      c.supportsInterface("0x80ac58cd", { blockTag }),
      c.MAX_SUPPLY({ blockTag }),
      c.BREED_COOLDOWN({ blockTag }),
      c.totalMinted({ blockTag }),
      c.totalSupply({ blockTag }),
      m.nft({ blockTag }),
    ]);
  if (
    name !== "Lionverse" ||
    symbol !== "LION" ||
    !erc721 ||
    cap !== 10000n ||
    cooldown !== 300n
  )
    throw new Error("The NFT does not expose the expected Lionverse configuration.");
  if (getAddress(boundNft) !== nft)
    throw new Error("This marketplace belongs to a different NFT contract.");
  return {
    chainId,
    address: nft,
    marketAddress: market,
    blockNumber: blockTag,
    totalMinted: minted.toString(),
    activeSupply: supply.toString(),
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      nft: { type: "string" },
      market: { type: "string" },
      rpc: { type: "string" },
      help: { type: "boolean" },
    },
  });
  if (values.help) {
    console.log(
      "npm run remix:connect -- --nft 0x... --market 0x... [--rpc https://your-sepolia-rpc]",
    );
    return;
  }
  if (!values.nft || !values.market)
    throw new Error(
      "Supply --nft and --market using the addresses actually deployed in Remix. Use --help for an example.",
    );
  const rpc = values.rpc || "https://ethereum-sepolia-rpc.publicnode.com";
  const url = new URL(rpc);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("RPC must be an HTTP(S) URL.");
  const provider = new JsonRpcProvider(rpc);
  try {
    const record = await validateDeployment(provider, values.nft, values.market);
    // No wallet, signing or deployment here. Only persist public addresses after validation.
    await mkdir("deployments", { recursive: true });
    await writeFile(
      `deployments/11155111-remix-${Date.now()}.json`,
      JSON.stringify(
        {
          ...record,
          connectionMethod: "manually-provided-remix-addresses",
          checkedAt: new Date().toISOString(),
        },
        null,
        2,
      ) + "\n",
    );
    updateEnv({
      VITE_CONTRACT_ADDRESS: record.address,
      VITE_MARKET_ADDRESS: record.marketAddress,
      VITE_CHAIN_ID: "11155111",
      VITE_RPC_URL: rpc,
    });
    console.log("Sepolia contracts validated. Updated .env.local; restart npm run dev.");
    console.log(`NFT: https://sepolia.etherscan.io/address/${record.address}`);
    console.log(`Market: https://sepolia.etherscan.io/address/${record.marketAddress}`);
  } finally {
    provider.destroy();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.shortMessage || error.message);
    process.exitCode = 1;
  });
}
