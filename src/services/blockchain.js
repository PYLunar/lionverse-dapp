import ABI from "../generated/LionNFT.abi.json" with { type: "json" };
import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  getAddress,
  isAddress,
} from "ethers";

export const ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
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
  const [data, owner, nextBreedAt, uri] = await Promise.all([
    c.getLion(id, { blockTag }),
    c.ownerOf(id, { blockTag }),
    c.nextBreedAt(id, { blockTag }),
    c.tokenURI(id, { blockTag }),
  ]);
  // Image and traits are both obtained from the same on-chain block snapshot.
  const metadata = JSON.parse(atob(uri.split(",")[1]));
  return {
    id: Number(id),
    owner,
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
  const supply = Number(await c.totalSupply({ blockTag }));
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
  return { lions, total, supply };
}

export async function transact(action, args, onStatus) {
  if (!["mint", "breed", "transfer"].includes(action)) throw new Error("不支持的操作。");
  const account = await connect();
  const provider = new BrowserProvider(window.ethereum);
  if (Number((await provider.getNetwork()).chainId) !== CHAIN_ID)
    throw new Error("钱包网络已改变，请重新连接。");
  const c = new Contract(ADDRESS, ABI, await provider.getSigner());
  onStatus("请在钱包中确认交易", "");
  let tx;
  if (action === "transfer") {
    if (!isAddress(args[0]) || /^0x0{40}$/i.test(args[0]))
      throw new Error("请输入有效的接收地址。");
    if (getAddress(args[0]) === getAddress(account))
      throw new Error("接收地址不能是当前钱包。");
    tx = await c["safeTransferFrom(address,address,uint256)"](account, args[0], args[1]);
  } else tx = await c[action](...args);
  onStatus("交易已提交，等待确认…", tx.hash);
  let receipt;
  try {
    receipt = await tx.wait();
  } catch (error) {
    if (error.code !== "TRANSACTION_REPLACED" || error.cancelled) throw error;
    receipt = error.receipt;
  }
  if (!receipt || receipt.status !== 1) throw new Error("交易未成功。");
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
  if (born) {
    try {
      lion = await loadLion(born.args.tokenId);
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
  };
  return (
    messages[error.revert?.name] ||
    error.reason ||
    error.shortMessage ||
    error.message ||
    "操作失败，请重试。"
  );
}
