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
export const NETWORK = LOCAL ? "本地测试网" : "Sepolia";
export const EXPLORER = LOCAL ? "" : "https://sepolia.etherscan.io";
export const CONFIGURED = isAddress(ADDRESS) && [31337, 11155111].includes(CHAIN_ID);
const RPC =
  import.meta.env.VITE_RPC_URL ||
  (LOCAL ? "http://127.0.0.1:8545" : "https://ethereum-sepolia-rpc.publicnode.com");
let readProvider;

async function reader() {
  if (!CONFIGURED) throw new Error("请先按 README 部署简化版合约。");
  readProvider ||= new JsonRpcProvider(RPC);
  const network = await readProvider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) throw new Error("RPC 与配置的网络不一致。");
  if ((await readProvider.getCode(ADDRESS)) === "0x")
    throw new Error("合约地址没有代码，请重新部署。");
  return new Contract(ADDRESS, ABI, readProvider);
}

export async function connect() {
  if (!window.ethereum)
    throw new Error("未检测到钱包，请在安装了 MetaMask 的浏览器中打开此页面。");
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
    throw new Error("交易市场尚未部署，请运行市场部署命令。");
  const market = new Contract(MARKET_ADDRESS, MARKET_ABI, readProvider);
  if ((await market.nft()).toLowerCase() !== ADDRESS.toLowerCase())
    throw new Error("市场与当前 NFT 合约不匹配。");
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
  onStatus("交易已提交，等待确认…", tx.hash);
  let receipt;
  try {
    receipt = await tx.wait();
  } catch (error) {
    if (error.code !== "TRANSACTION_REPLACED" || error.cancelled) throw error;
    receipt = error.receipt;
  }
  if (!receipt || receipt.status !== 1) throw new Error("交易未成功。");
  return receipt;
}

export async function transact(action, args, onStatus) {
  if (
    !["mint", "breed", "transfer", "list", "buy", "cancel", "withdraw", "burn"].includes(
      action,
    )
  )
    throw new Error("不支持的操作。");
  const account = await connect();
  const provider = new BrowserProvider(window.ethereum);
  if (Number((await provider.getNetwork()).chainId) !== CHAIN_ID)
    throw new Error("钱包网络已改变，请重新连接。");
  const signer = await provider.getSigner();
  const c = new Contract(ADDRESS, ABI, signer);
  onStatus("请在钱包中确认交易", "");
  let tx;
  if (action === "transfer") {
    if (!isAddress(args[0]) || /^0x0{40}$/i.test(args[0]))
      throw new Error("请输入有效的接收地址。");
    if (getAddress(args[0]) === getAddress(account))
      throw new Error("接收地址不能是当前钱包。");
    tx = await c["safeTransferFrom(address,address,uint256)"](account, args[0], args[1]);
  } else if (["list", "buy", "cancel", "withdraw"].includes(action)) {
    await marketReader();
    const m = new Contract(MARKET_ADDRESS, MARKET_ABI, signer);
    if (action === "list") {
      let price;
      try {
        price = parseEther(args[1]);
      } catch {
        throw new Error("请输入有效的 ETH 价格，最多 18 位小数。");
      }
      if (price <= 0n) throw new Error("挂单价格必须大于 0。");
      if ((await c.ownerOf(args[0])).toLowerCase() !== account.toLowerCase())
        throw new Error("只能挂单自己拥有的 NFT。");
      if (
        (await c.getApproved(args[0])).toLowerCase() !== MARKET_ADDRESS.toLowerCase() &&
        !(await c.isApprovedForAll(account, MARKET_ADDRESS))
      ) {
        onStatus("第 1 步：请授权这只 NFT 给市场（需要一次钱包确认）", "");
        await confirmed(await c.approve(MARKET_ADDRESS, args[0]), onStatus);
      }
      const active = await window.ethereum.request({ method: "eth_accounts" });
      const chain = await window.ethereum.request({ method: "eth_chainId" });
      if (
        active[0]?.toLowerCase() !== account.toLowerCase() ||
        Number(chain) !== CHAIN_ID
      )
        throw new Error("钱包账号或网络已改变，授权不会自动挂单，请重新操作。");
      onStatus(
        "第 2 步：请确认价格和上架交易。若取消，NFT 仍在你的钱包，可重新上架或撤销授权。",
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
  if ([4001, "ACTION_REJECTED"].includes(error.code)) return "你取消了钱包操作。";
  if (error.code === "INSUFFICIENT_FUNDS") return "测试 ETH 不足，无法支付 Gas。";
  const messages = {
    SameParent: "请选择两只不同的狮子。",
    NotParentOwner: "两只亲代必须属于当前钱包。",
    ParentResting: "亲代还在冷却，请稍后重试。",
    SoldOut: "已达到 10,000 只上限。",
    ERC721NonexistentToken: "未找到该狮子。",
    NotTokenOwner: "只有 NFT 当前主人可以销毁，授权地址不能代为销毁。",
    InvalidPrice: "挂单价格必须大于 0。",
    NotOwner: "只有 NFT 主人才能挂单。",
    NotListed: "该 NFT 已成交或已撤单，请刷新市场。",
    NotSeller: "只有卖家可以撤单。",
    WrongPayment: "支付金额与挂单价不同，请刷新市场。",
    SelfPurchase: "不能购买自己的挂单。",
    NoProceeds: "没有可领取的成交款。",
    PaymentFailed: "领取失败，款项仍保存在合约中。",
  };
  return (
    messages[error.revert?.name] ||
    error.reason ||
    error.shortMessage ||
    error.message ||
    "操作失败，请重试。"
  );
}
