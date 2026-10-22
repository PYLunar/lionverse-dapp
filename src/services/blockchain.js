import ABI from "../generated/LionNFT.abi.json" with { type: "json" };
import { GENETICS_VERSION } from "../domain/genetics.js";
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
export const CONFIGURED = isAddress(ADDRESS) && [11155111, 31337].includes(CHAIN_ID);
const RPC =
  import.meta.env.VITE_RPC_URL ||
  (LOCAL ? "http://127.0.0.1:8545" : "https://ethereum-sepolia-rpc.publicnode.com");
export { ABI };
let readProvider;
function configured() {
  if (!CONFIGURED)
    throw new Error(
      "链上模式尚未配置。请按 README 部署合约并设置地址，或先体验演示模式。",
    );
}
async function reader() {
  configured();
  readProvider ||= new JsonRpcProvider(RPC);
  const network = await readProvider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID)
    throw new Error("RPC 网络与配置不一致，请检查 VITE_CHAIN_ID 和 VITE_RPC_URL。");
  if ((await readProvider.getCode(ADDRESS)) === "0x")
    throw new Error("该地址没有合约，请检查部署地址或重新部署本地合约。");
  const contract = new Contract(ADDRESS, ABI, readProvider);
  const incompatible = () =>
    new Error("当前地址不是双基因新版合约。请部署新版并更新地址；旧藏品仍保留在原合约。");
  let version;
  try {
    version = await contract.GENETICS_VERSION();
  } catch (error) {
    if (error.code === "CALL_EXCEPTION") throw incompatible();
    throw error;
  }
  if (Number(version) !== GENETICS_VERSION) throw incompatible();
  return contract;
}
export async function connect() {
  configured();
  if (!window.ethereum)
    throw new Error("未检测到钱包。请安装 MetaMask，或切回演示模式体验。");
  // Validate the protocol before requesting a signature; a v1 mint has different rules.
  await reader();
  const hex = `0x${CHAIN_ID.toString(16)}`;
  const current = await window.ethereum.request({ method: "eth_chainId" });
  if (current.toLowerCase() !== hex) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hex }],
      });
    } catch (error) {
      if (error.code !== 4902) throw error;
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hex,
            chainName: LOCAL ? "Lionverse Local" : "Sepolia",
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
export async function loadLion(id, contract, blockTag = "latest") {
  const c = contract || (await reader());
  const [data, owner, nextBreedAt, genes] = await Promise.all([
    c.getLion(id, { blockTag }),
    c.ownerOf(id, { blockTag }),
    c.nextBreedAt(id, { blockTag }),
    c.getGenes(id, { blockTag }),
  ]);
  const numericKeys = [
    "species",
    "aura",
    "crown",
    "fur",
    "mane",
    "eyes",
    "pattern",
    "temperament",
    "rarity",
    "generation",
    "bornAt",
    "parentA",
    "parentB",
  ];
  return {
    id: Number(id),
    genes: Array.from(genes, Number),
    geneticsVersion: GENETICS_VERSION,
    owner,
    nextBreedAt: Number(nextBreedAt),
    dna: data.dna.toString(),
    ...Object.fromEntries(numericKeys.map((key) => [key, Number(data[key])])),
  };
}
export async function loadPage(owner, offset = 0, limit = 12, account = owner, snapshot) {
  const contract = await reader();
  const blockNumber = snapshot ?? Number(await readProvider.send("eth_blockNumber", []));
  const blockTag = blockNumber;
  const [supply, balance] = await Promise.all([
    contract.totalSupply({ blockTag }),
    account ? contract.balanceOf(account, { blockTag }) : 0n,
  ]);
  const total = Number(owner ? balance : supply);
  const indexes = Array.from(
    { length: Math.min(limit, Math.max(0, total - offset)) },
    (_, i) => total - offset - i - 1,
  );
  const ids = owner
    ? await Promise.all(
        indexes.map((i) => contract.tokenOfOwnerByIndex(owner, i, { blockTag })),
      )
    : indexes.map((i) => i + 1);
  return {
    lions: await Promise.all(ids.map((id) => loadLion(id, contract, blockTag))),
    blockNumber,
    total,
    supply: Number(supply),
    owned: Number(balance),
  };
}
/** Direct-child indexes are independent of current ownership. */
export async function loadChildren(id, offset = 0, limit = 6) {
  const contract = await reader();
  const [ids, total] = await Promise.all([
    contract.childrenOf(id, offset, limit),
    contract.childCount(id),
  ]);
  return { ids: Array.from(ids, Number), total: Number(total) };
}

export async function transact(action, args, onStatus) {
  const account = await connect();
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  if (Number((await provider.getNetwork()).chainId) !== CHAIN_ID)
    throw new Error("钱包网络已变化，请重新连接。");
  const contract = new Contract(ADDRESS, ABI, signer);
  onStatus("请在钱包中确认交易", "");
  let tx;
  if (action === "transfer") {
    if (!isAddress(args[0]) || /^0x0{40}$/i.test(args[0]))
      throw new Error("请输入有效的接收地址。");
    const to = getAddress(args[0]);
    if (to === account) throw new Error("接收地址不能是你自己的地址。");
    tx = await contract["safeTransferFrom(address,address,uint256)"](
      account,
      to,
      args[1],
    );
  } else tx = await contract[action](...args);
  onStatus("交易已提交，正在等待链上确认…", tx.hash);
  let receipt;
  try {
    receipt = await tx.wait();
  } catch (error) {
    if (
      error.code !== "TRANSACTION_REPLACED" ||
      error.cancelled ||
      error.reason !== "repriced"
    )
      throw error;
    receipt = error.receipt;
    onStatus("替换交易已确认", receipt.hash);
  }
  if (receipt.status !== 1) throw new Error("交易失败，链上状态未改变。");
  const born = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((log) => log?.name === "LionBorn");
  let lion = null;
  let detailsUnavailable = false;
  if (born) {
    // Confirmation is final even if a subsequent RPC read fails. Never present
    // an already minted NFT as a failed transaction and invite another mint.
    try {
      lion = await loadLion(born.args.tokenId);
    } catch {
      detailsUnavailable = true;
    }
  }
  return { account, hash: receipt.hash, lion, detailsUnavailable };
}
export function friendlyError(error) {
  if (error.code === 4001 || error.code === "ACTION_REJECTED")
    return "你取消了钱包操作，可以随时重试。";
  if (error.code === "INSUFFICIENT_FUNDS")
    return "测试 ETH 不足，请先领取测试币支付 Gas。";
  if (error.code === "TRANSACTION_REPLACED" && error.cancelled)
    return "交易已取消或被其他交易替换。";
  const name = error.revert?.name;
  if (name === "ERC721NonexistentToken") return "未找到该编号的狮子。";
  if (name === "ParentResting") return "狮子正在休息，冷却结束后再来繁育吧。";
  if (name === "NotParentOwner") return "两只亲代都必须属于当前钱包。";
  if (name === "SameParent") return "请选择两只不同的狮子。";
  if (name === "SoldOut") return "已达到 10,000 只的总量上限。";
  if (error.code === "NETWORK_ERROR" || error.code === "SERVER_ERROR")
    return "暂时无法连接测试网络，请检查 RPC 地址与网络后重试。";
  return error.reason || error.shortMessage || error.message || "操作未完成，请重试。";
}
