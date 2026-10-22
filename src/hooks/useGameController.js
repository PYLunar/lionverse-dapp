import { useEffect, useRef, useState } from "react";
import { DEMO_OWNER } from "../domain/constants.js";
import { FURS, SPECIES, lionName, lionEnglish, tokenNumber } from "../domain/catalog.js";
import { createDemoLion, initialDemo } from "../domain/demo.js";
import {
  readDemo,
  saveDemo as persistDemo,
  randomSeed,
} from "../services/demoStorage.js";
import {
  CHAIN_ID,
  CONFIGURED,
  NETWORK,
  connect,
  friendlyError,
  loadPage,
  transact,
} from "../services/blockchain.js";

/** Coordinates account changes, collection refreshes and atomic user actions. */
export default function useGameController() {
  const [mode, setMode] = useState("demo");
  const [page, setPage] = useState("explore");
  const [familyRoot, setFamilyRoot] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [demo, setDemo] = useState(readDemo);
  const [wallet, setWallet] = useState("");
  const [chainLions, setChainLions] = useState([]);
  const [chainTotal, setChainTotal] = useState(0);
  const [supply, setSupply] = useState(0);
  const [ownCount, setOwnCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("all");
  const [sort, setSort] = useState("old");
  const [detail, setDetail] = useState(null);
  const [newborn, setNewborn] = useState(false);
  const [mintOpen, setMintOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [preferredParent, setPreferredParent] = useState(null);
  const [parentA, setParentA] = useState("");
  const [parentB, setParentB] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [now, setNow] = useState(Date.now());
  const account = mode === "demo" ? DEMO_OWNER : wallet;
  const isOwned = (lion) =>
    !!account && lion.owner.toLowerCase() === account.toLowerCase();
  const ownedPage = page === "collection" || page === "breed";
  const visibleLions =
    mode === "demo" ? demo.filter((l) => !ownedPage || isOwned(l)) : chainLions;
  const parentPool =
    mode === "demo"
      ? demo
      : preferredParent && !chainLions.some((lion) => lion.id === preferredParent.id)
        ? [...chainLions, preferredParent]
        : chainLions;
  const owned = parentPool.filter(isOwned);
  const totalOwned =
    mode === "demo" ? demo.filter((l) => l.owner === DEMO_OWNER).length : ownCount;
  const totalSupply = mode === "demo" ? demo.length : supply;
  const a = owned.find((l) => String(l.id) === parentA);
  const b = owned.find((l) => String(l.id) === parentB);
  const resting = [a, b].some((l) => l && l.nextBreedAt > now / 1000);
  const tell = (message, kind = "info") => setNotice({ message, kind });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!notice || busy) return;
    const timer = setTimeout(
      () => setNotice(null),
      notice.kind === "error" ? 12000 : 6500,
    );
    return () => clearTimeout(timer);
  }, [notice, busy]);
  useEffect(() => {
    if (!window.ethereum?.on) return;
    const accountsChanged = (accounts) => {
      setWallet(accounts[0] || "");
      setDetail(null);
      setRecipient("");
      setChainLions([]);
      setOffset(0);
      setPreferredParent(null);
      setParentA("");
      setParentB("");
      setRefresh((n) => n + 1);
    };
    const chainChanged = (chain) => {
      setDetail(null);
      setChainLions([]);
      setOffset(0);
      setRefresh((n) => n + 1);
      if (Number(chain) !== CHAIN_ID) {
        setWallet("");
        setNotice({ message: `钱包网络已改变，请重新连接 ${NETWORK}。`, kind: "info" });
      }
    };
    window.ethereum.on("accountsChanged", accountsChanged);
    window.ethereum.on("chainChanged", chainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", accountsChanged);
      window.ethereum.removeListener("chainChanged", chainChanged);
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (mode !== "chain" || ["guide", "family"].includes(page)) {
      setLoading(false);
      return;
    }
    if (!CONFIGURED || (ownedPage && !wallet)) {
      setChainLions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    if (!offset) setChainLions([]);
    loadPage(ownedPage ? wallet : null, offset, 12, wallet)
      .then((result) => {
        if (cancelled) return;
        setChainLions((old) =>
          offset
            ? [...old, ...result.lions.filter((l) => !old.some((o) => o.id === l.id))]
            : result.lions,
        );
        setChainTotal(result.total);
        setSupply(result.supply);
        setOwnCount(result.owned);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(friendlyError(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, page, wallet, refresh, offset, ownedPage]);

  function navigate(next) {
    setPage(next);
    setMobileNav(false);
    setOffset(0);
    setQuery("");
    setRarity("all");
    setLoadError("");
    setChainLions([]);
  }
  function changeMode(next) {
    if (busyRef.current) return;
    setMode(next);
    setFamilyRoot(null);
    setOffset(0);
    setChainLions([]);
    setLoadError("");
    setDetail(null);
    setMintOpen(false);
    setPreferredParent(null);
    setParentA("");
    setParentB("");
    setTxHash("");
    setNotice(null);
  }
  function saveDemo(next) {
    try {
      persistDemo(next);
    } catch {
      throw new Error("浏览器无法保存演示收藏，请允许本站使用本地存储后重试。");
    }
    setDemo(next);
  }
  async function connectWallet() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const address = await connect();
      setWallet(address);
      setMode("chain");
      if (mode !== "chain") setFamilyRoot(null);
      setOffset(0);
      tell("钱包已连接", "success");
    } catch (error) {
      tell(friendlyError(error), "error");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function perform(action, args = []) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setTxHash("");
    try {
      let lion;
      let detailsUnavailable = false;
      if (mode === "demo") {
        if (action === "transfer")
          throw new Error("转赠需要链上钱包，请切换到链上模式。");
        const result = createDemoLion(
          demo,
          action === "breed" ? a : null,
          action === "breed" ? b : null,
          { seed: randomSeed(), now: Math.floor(Date.now() / 1000) },
        );
        saveDemo(result.lions);
        lion = result.lion;
      } else {
        const result = await transact(action, args, (message, hash) => {
          tell(message);
          setTxHash(hash);
        });
        // Respect account/network changes made while the transaction was mining.
        const [accounts, chain] = await Promise.allSettled([
          window.ethereum.request({ method: "eth_accounts" }),
          window.ethereum.request({ method: "eth_chainId" }),
        ]);
        setWallet(
          accounts.status === "fulfilled" &&
            chain.status === "fulfilled" &&
            Number(chain.value) === CHAIN_ID
            ? accounts.value[0] || ""
            : "",
        );
        setTxHash(result.hash);
        lion = result.lion;
        detailsUnavailable = result.detailsUnavailable;
        setOffset(0);
        setRefresh((n) => n + 1);
      }
      setMintOpen(false);
      setRecipient("");
      if (lion) {
        setDetail(lion);
        setNewborn(true);
      } else setDetail(null);
      tell(
        action === "transfer"
          ? "转赠已在链上确认。"
          : mode === "demo"
            ? "新伙伴已加入演示狮群，保存在当前浏览器。"
            : detailsUnavailable
              ? "铸造已确认，详情暂时无法读取。请刷新收藏，无需重复铸造。"
              : "新伙伴已在链上诞生！",
        "success",
      );
      if (action === "breed") {
        setPreferredParent(null);
        setParentA("");
        setParentB("");
      }
    } catch (error) {
      tell(friendlyError(error), "error");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function startBreeding(lion) {
    // Keep an explicitly selected older token available beyond the latest gallery page.
    setPreferredParent(lion);
    navigate("breed");
    setParentA(String(lion.id));
    setParentB("");
    setDetail(null);
  }
  function openDetail(lion) {
    setDetail(lion);
    setNewborn(false);
    setRecipient("");
  }
  const filtered = visibleLions
    .filter(
      (l) =>
        (rarity === "all" || l.rarity === Number(rarity)) &&
        `${lionName(l)} ${lionEnglish(l)} ${tokenNumber(l.id)} ${FURS[l.fur].name} ${SPECIES[l.species].name}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((x, y) =>
      sort === "rarity"
        ? y.rarity - x.rarity || y.id - x.id
        : sort === "old"
          ? x.id - y.id
          : y.id - x.id,
    );
  const featured = initialDemo()[0];

  return {
    mode,
    page,
    mobileNav,
    setMobileNav,
    demo,
    wallet,
    chainLions,
    chainTotal,
    totalOwned,
    totalSupply,
    loading,
    loadError,
    setRefresh,
    setOffset,
    ownedPage,
    visibleLions,
    filtered,
    query,
    setQuery,
    rarity,
    setRarity,
    sort,
    setSort,
    detail,
    newborn,
    mintOpen,
    setMintOpen,
    recipient,
    setRecipient,
    parentA,
    setParentA,
    parentB,
    setParentB,
    busy,
    notice,
    setNotice,
    txHash,
    now,
    a,
    b,
    owned,
    resting,
    navigate,
    changeMode,
    connectWallet,
    perform,
    openDetail,
    tell,
    setDetail,
    featured,
    familyRoot,
    setFamilyRoot,
    isOwned,
    startBreeding,
  };
}
