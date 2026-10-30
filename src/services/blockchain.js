import ABI from "../generated/LionNFT.abi.json" with { type: "json" };
import MARKET_ABI from "../generated/LionMarketplace.abi.json" with { type: "json" };
import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  getAddress,
  isAddress,
  parseEther,
  formatEther,
} from "ethers";
export { formatEther };

export const ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
export const MARKET_ADDRESS = import.meta.env.VITE_MARKET_ADDRESS || "";
export const MARKET_CONFIGURED = isAddress(MARKET_ADDRESS);
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 11155111);
export const LOCAL = CHAIN_ID === 31337;
export const NETWORK = LOCAL ? "Local Testnet" : "Sepolia";
export const EXPLORER = LOCAL ? "" : "https://sepolia.etherscan.io";
export const CONFIGURED = isAddress(ADDRESS) && [31337, 11155111].includes(CHAIN_ID);
const RPC =
  import.meta.env.VITE_RPC_URL ||
  (LOCAL ? "http://127.0.0.1:8545" : "https://ethereum-sepolia-rpc.publicnode.com");
let readProvider;

async function reader() {
  if (!CONFIGURED) throw new Error("Please deploy the contracts using the README first.");
  readProvider ||= new JsonRpcProvider(RPC);
  const network = await readProvider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID)
    throw new Error("The RPC network does not match the configured network.");
  if ((await readProvider.getCode(ADDRESS)) === "0x")
    throw new Error("No contract found at this address. Please redeploy.");
  return new Contract(ADDRESS, ABI, readProvider);
}

export async function connect() {
  if (!window.ethereum)
    throw new Error(
      "No wallet detected. Open this page in a browser with MetaMask installed.",
    );
  await reader();
  const hex = `0x${CHAIN_ID.toString(16)}`;
  if (Number(await window.ethereum.request({ method: "eth_chainId" })) !== CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hex }],
      });
    } catch (error) {
      if (Number(error.code) !== 4902) throw error;
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hex,
            chainName: NETWORK,
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: [RPC],
            ...(EXPLORER ? { blockExplorerUrls: [EXPLORER] } : {}),
          },
        ],
      });
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hex }],
      });
    }
  }
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return (await provider.getSigner()).getAddress();
}

export async function loadLion(id, c, blockTag = "latest") {
  c ||= await reader();
  if (blockTag === "latest")
    blockTag = Number(await readProvider.send("eth_blockNumber", []));
  const [data, burned, nextBreedAt] = await Promise.all([
    c.getLion(id, { blockTag }),
    c.isBurned(id, { blockTag }),
    c.nextBreedAt(id, { blockTag }),
  ]);
  const [owner, uri] = await Promise.all([
    burned ? "0x0000000000000000000000000000000000000000" : c.ownerOf(id, { blockTag }),
    burned ? c.historicalTokenURI(id, { blockTag }) : c.tokenURI(id, { blockTag }),
  ]);
  // Image and traits are both obtained from the same on-chain block snapshot.
  const metadata = JSON.parse(atob(uri.split(",")[1]));
  return {
    id: Number(id),
    owner,
    burned,
    nextBreedAt: Number(nextBreedAt),
    image: metadata.image,
    ...Object.fromEntries(
      [
        "species",
        "fur",
        "mane",
        "eyes",
        "generation",
        "bornAt",
        "parentA",
        "parentB",
      ].map((key) => [key, Number(data[key])]),
    ),
  };
}

export async function loadCollection(owner, limit = 12) {
  const c = await reader();
  const blockTag = Number(await readProvider.send("eth_blockNumber", []));
  const [supplyValue, mintedValue] = await Promise.all([
    c.totalSupply({ blockTag }),
    c.totalMinted({ blockTag }),
  ]);
  const supply = Number(supplyValue);
  const minted = Number(mintedValue);
  const total = owner ? Number(await c.balanceOf(owner, { blockTag })) : 0;
  const lions = [];
  for (let offset = 0; offset < Math.min(limit, total); offset += 12) {
    const indexes = Array.from(
      { length: Math.min(12, Math.min(limit, total) - offset) },
      (_, i) => total - offset - i - 1,
    );
    const ids = await Promise.all(
      indexes.map((i) => c.tokenOfOwnerByIndex(owner, i, { blockTag })),
    );
    lions.push(...(await Promise.all(ids.map((id) => loadLion(id, c, blockTag)))));
  }
  return { lions, total, supply, minted, blockNumber: blockTag };
}

async function marketReader() {
  await reader();
  if (!MARKET_CONFIGURED || (await readProvider.getCode(MARKET_ADDRESS)) === "0x")
    throw new Error("The marketplace is not deployed. Please deploy it first.");
  const market = new Contract(MARKET_ADDRESS, MARKET_ABI, readProvider);
  if ((await market.nft()).toLowerCase() !== ADDRESS.toLowerCase())
    throw new Error("The marketplace does not match the current NFT contract.");
  return market;
}

export async function loadMarket(account, limit = 12) {
  const m = await marketReader();
  const result = await loadCollection(MARKET_ADDRESS, limit);
  const blockTag = result.blockNumber;
  // Refresh the listings together with the NFT snapshot to avoid displaying sold offers.
  const items = await Promise.all(
    result.lions.map(async (lion) => {
      const listing = await m.listings(lion.id, { blockTag });
      return listing.seller === "0x0000000000000000000000000000000000000000"
        ? null
        : {
            ...lion,
            listing: { seller: listing.seller, price: listing.price.toString() },
          };
    }),
  );
  const credit = account ? await m.proceeds(account, { blockTag }) : 0n;
  return {
    lions: items.filter(Boolean),
    total: result.total,
    proceeds: credit.toString(),
  };
}

async function confirmed(tx, onStatus) {
  onStatus("Transaction submitted. Waiting for confirmation…", tx.hash);
  let receipt;
  try {
    receipt = await tx.wait();
  } catch (error) {
    if (error.code !== "TRANSACTION_REPLACED" || error.cancelled) throw error;
    receipt = error.receipt;
  }
  if (!receipt || receipt.status !== 1) throw new Error("The transaction failed.");
  return receipt;
}

export async function transact(action, args, onStatus) {
  if (
    !["mint", "breed", "transfer", "list", "buy", "cancel", "withdraw", "burn"].includes(
      action,
    )
  )
    throw new Error("Unsupported action.");
  const account = await connect();
  const provider = new BrowserProvider(window.ethereum);
  if (Number((await provider.getNetwork()).chainId) !== CHAIN_ID)
    throw new Error("Your wallet network changed. Please reconnect.");
  const signer = await provider.getSigner();
  const c = new Contract(ADDRESS, ABI, signer);
  onStatus("Please confirm the transaction in your wallet.", "");
  let tx;
  if (action === "transfer") {
    if (!isAddress(args[0]) || /^0x0{40}$/i.test(args[0]))
      throw new Error("Please enter a valid recipient address.");
    if (getAddress(args[0]) === getAddress(account))
      throw new Error("The recipient must be different from your current wallet.");
    tx = await c["safeTransferFrom(address,address,uint256)"](account, args[0], args[1]);
  } else if (["list", "buy", "cancel", "withdraw"].includes(action)) {
    await marketReader();
    const m = new Contract(MARKET_ADDRESS, MARKET_ABI, signer);
    if (action === "list") {
      let price;
      try {
        price = parseEther(args[1]);
      } catch {
        throw new Error("Please enter a valid ETH price with up to 18 decimal places.");
      }
      if (price <= 0n) throw new Error("The listing price must be greater than 0.");
      if ((await c.ownerOf(args[0])).toLowerCase() !== account.toLowerCase())
        throw new Error("You can only list an NFT you own.");
      if (
        (await c.getApproved(args[0])).toLowerCase() !== MARKET_ADDRESS.toLowerCase() &&
        !(await c.isApprovedForAll(account, MARKET_ADDRESS))
      ) {
        onStatus("Step 1: Approve this NFT for the marketplace in your wallet.", "");
        await confirmed(await c.approve(MARKET_ADDRESS, args[0]), onStatus);
      }
      const active = await window.ethereum.request({ method: "eth_accounts" });
      const chain = await window.ethereum.request({ method: "eth_chainId" });
      if (
        active[0]?.toLowerCase() !== account.toLowerCase() ||
        Number(chain) !== CHAIN_ID
      )
        throw new Error(
          "Your wallet account or network changed. Approval does not list the NFT automatically; please try again.",
        );
      onStatus(
        "Step 2: Confirm the price and listing transaction. If you cancel, the NFT stays in your wallet; you can list it again or revoke approval.",
        "",
      );
      tx = await m.list(args[0], price);
    } else if (action === "buy") tx = await m.buy(args[0], { value: BigInt(args[1]) });
    else if (action === "cancel") tx = await m.cancel(args[0]);
    else tx = await m.withdraw();
  } else tx = await c[action](...args);
  const receipt = await confirmed(tx, onStatus);
  const born = receipt.logs
    .map((log) => {
      try {
        return c.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((log) => log?.name === "LionBorn");
  // A read failure after confirmation must never be reported as a failed mint.
  let lion = null;
  if (born || action === "buy" || action === "cancel") {
    try {
      lion = await loadLion(born ? born.args.tokenId : args[0]);
    } catch {
      /* Refresh collection later. */
    }
  }
  return { account, hash: receipt.hash, lion };
}

export function friendlyError(error) {
  if ([4001, "ACTION_REJECTED"].includes(error.code))
    return "You canceled the wallet request.";
  if (error.code === "INSUFFICIENT_FUNDS") return "Not enough test ETH to pay for gas.";
  const messages = {
    SameParent: "Please choose two different lions.",
    NotParentOwner: "Both parents must belong to your current wallet.",
    ParentResting: "The parents are still resting. Please try again later.",
    SoldOut: "The lifetime limit of 10,000 lions has been reached.",
    ERC721NonexistentToken: "Lion not found.",
    NotTokenOwner:
      "Only the current NFT owner can burn it. Approved addresses cannot burn on their behalf.",
    InvalidPrice: "The listing price must be greater than 0.",
    NotOwner: "Only the NFT owner can list it.",
    NotListed:
      "This NFT has been sold or its listing canceled. Please refresh the marketplace.",
    NotSeller: "Only the seller can cancel this listing.",
    WrongPayment:
      "The payment does not match the listing price. Please refresh the marketplace.",
    SelfPurchase: "You cannot buy your own listing.",
    NoProceeds: "There are no sale proceeds to withdraw.",
    PaymentFailed: "Withdrawal failed. Your funds remain in the contract.",
  };
  return (
    messages[error.revert?.name] ||
    error.reason ||
    error.shortMessage ||
    error.message ||
    "The action failed. Please try again."
  );
}
