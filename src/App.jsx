import { useEffect, useRef, useState } from "react";
import { PawPrint, Wallet, ArrowUpRight } from "lucide-react";
import Modal from "./components/Modal.jsx";
import MarketPage from "./components/MarketPage.jsx";
import SpeciesStory from "./components/SpeciesStory.jsx";
import { shortAddress, rarityOf, traitLabels } from "./domain/catalog.js";
import {
  ADDRESS,
  CHAIN_ID,
  NETWORK,
  EXPLORER,
  CONFIGURED,
  MARKET_CONFIGURED,
  formatEther,
  connect,
  loadCollection,
  loadLion,
  transact,
  friendlyError,
} from "./services/blockchain.js";

const PAGES = [
  ["mint", "铸造"],
  ["collection", "我的狮群"],
  ["breed", "繁育"],
  ["market", "交易市场"],
];

export default function App() {
  const [page, setPage] = useState("mint");
  const [account, setAccount] = useState("");
  const [collection, setCollection] = useState({
    lions: [],
    total: 0,
    supply: 0,
    minted: 0,
  });
  const [limit, setLimit] = useState(12);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [hash, setHash] = useState("");
  const [detail, setDetail] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [burnTarget, setBurnTarget] = useState(null);
  const [burnInput, setBurnInput] = useState("");
  const [parentA, setParentA] = useState("");
  const [parentB, setParentB] = useState("");
  const [now, setNow] = useState(Date.now());
  const busyRef = useRef(false);
  const identity = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum?.on) return;
    function reset() {
      identity.current++;
      setAccount("");
      setCollection({ lions: [], total: 0, supply: 0, minted: 0 });
      setBurnTarget(null);
      setBurnInput("");
      setDetail(null);
      setRecipient("");
      setParentA("");
      setParentB("");
      setLimit(12);
      setRefresh((n) => n + 1);
    }
    function networkChanged(chain) {
      reset();
      if (Number(chain) !== CHAIN_ID)
        setNotice({ error: true, text: `请连接 ${NETWORK}。` });
    }
    ethereum.on("accountsChanged", reset);
    ethereum.on("chainChanged", networkChanged);
    return () => {
      ethereum.removeListener("accountsChanged", reset);
      ethereum.removeListener("chainChanged", networkChanged);
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (!CONFIGURED) return;
    setLoading(true);
    setLoadError("");
    loadCollection(account, limit)
      .then((result) => {
        if (!cancelled) setCollection(result);
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
  }, [account, limit, refresh]);

  async function connectWallet() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      setAccount(await connect());
      setNotice(null);
    } catch (error) {
      setNotice({ error: true, text: friendlyError(error) });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function perform(action, args = []) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setHash("");
    try {
      const result = await transact(action, args, (text, txHash) => {
        setNotice({ text });
        setHash(txHash);
      });
      setHash(result.hash);
      setNotice({
        text:
          {
            transfer: "转赠已在链上确认。",
            list: "NFT 已上架；成交后请到市场领取款项。",
            buy: "购买成功，NFT 已转入你的钱包。",
            cancel: "挂单已撤销，NFT 已回到你的钱包。",
            withdraw: "成交款已领取到钱包。",
            burn: "NFT 已永久销毁，历史属性与父母记录仍可查询。",
          }[action] ||
          (result.lion
            ? "新狮子已在链上诞生！"
            : "铸造已确认，详情暂不可用，请刷新收藏。"),
      });
      const scope = identity.current;
      const [accounts, chain] = await Promise.allSettled([
        window.ethereum.request({ method: "eth_accounts" }),
        window.ethereum.request({ method: "eth_chainId" }),
      ]);
      if (
        scope === identity.current &&
        accounts.status === "fulfilled" &&
        chain.status === "fulfilled" &&
        Number(chain.value) === CHAIN_ID &&
        accounts.value[0]?.toLowerCase() === result.account.toLowerCase()
      ) {
        setAccount(result.account);
        setDetail(result.lion);
        setRecipient("");
        setSalePrice("");
        setBurnTarget(null);
        setBurnInput("");
        setParentA("");
        setParentB("");
      }
      setRefresh((n) => n + 1);
    } catch (error) {
      setNotice({ error: true, text: friendlyError(error) });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function showParent(id) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const scope = identity.current;
    try {
      const lion = await loadLion(id);
      if (scope === identity.current) {
        setDetail(lion);
        setRecipient("");
      }
    } catch (error) {
      setNotice({ error: true, text: friendlyError(error) });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const a = collection.lions.find((lion) => String(lion.id) === parentA);
  const b = collection.lions.find((lion) => String(lion.id) === parentB);
  const wait = Math.max(
    0,
    Math.ceil((Math.max(a?.nextBreedAt || 0, b?.nextBreedAt || 0) * 1000 - now) / 1000),
  );
  const ownDetail =
    detail &&
    !detail.burned &&
    account &&
    detail.owner.toLowerCase() === account.toLowerCase();

  return (
    <div className="app-shell">
      <header>
        <a className="brand" href="#mint" onClick={() => setPage("mint")}>
          <PawPrint size={25} /> 狮屿 <small>LIONVERSE</small>
        </a>
        <nav aria-label="主导航">
          {PAGES.map(([id, label]) => (
            <button
              key={id}
              aria-current={page === id ? "page" : undefined}
              onClick={() => {
                setPage(id);
                setNotice(null);
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <button className="wallet-button" onClick={connectWallet} disabled={busy}>
          <Wallet size={16} />
          {account ? shortAddress(account) : "连接钱包"}
        </button>
      </header>
      <main>
        <div className="network-line">
          <span className="network-dot" />
          {NETWORK}
          <span>{CONFIGURED ? `合约 ${shortAddress(ADDRESS)}` : "尚未部署合约"}</span>
        </div>
        {notice && !detail && !burnTarget && (
          <div
            role={notice.error ? "alert" : "status"}
            className={notice.error ? "notice error" : "notice"}
          >
            {notice.text}
            {hash &&
              (EXPLORER ? (
                <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer">
                  查看交易 ↗
                </a>
              ) : (
                <small>交易：{hash}</small>
              ))}
          </div>
        )}
        {loadError && (
          <div role="alert" className="notice error">
            {loadError}
            <button onClick={() => setRefresh((n) => n + 1)} disabled={loading}>
              重试
            </button>
          </div>
        )}
        {!CONFIGURED && (
          <p className="notice">请按 README 部署简化版合约，然后启动前端。</p>
        )}
        {page === "mint" && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">FOUR TRAITS. ONE LION.</p>
                <h1>
                  遇见你的
                  <br />
                  链上狮子。
                </h1>
                <p>
                  四项外观，一份属于钱包的收藏。铸造、繁育或转赠，每一步都记录在链上。
                </p>
                <button
                  className="primary"
                  disabled={busy || !CONFIGURED}
                  onClick={() => perform("mint")}
                >
                  {busy ? "处理中…" : account ? "铸造一只狮子" : "连接钱包并铸造"}
                </button>
                <small>铸造免费 · 仅需网络 Gas · 初代与子代冷却 5 分钟</small>
              </div>
              <div className="hero-art" aria-hidden="true">
                <svg viewBox="0 0 360 340">
                  <circle cx="180" cy="170" r="145" fill="#e4ddc5" />
                  <ellipse cx="180" cy="270" rx="58" ry="47" fill="#dfb86b" />
                  <circle cx="180" cy="148" r="112" fill="#a7723f" />
                  <circle cx="108" cy="97" r="24" fill="#e9c888" />
                  <circle cx="252" cy="97" r="24" fill="#e9c888" />
                  <ellipse cx="180" cy="155" rx="77" ry="82" fill="#efd49b" />
                  <ellipse cx="149" cy="148" rx="9" ry="13" fill="#384d3b" />
                  <ellipse cx="211" cy="148" rx="9" ry="13" fill="#384d3b" />
                  <ellipse cx="180" cy="191" rx="37" ry="25" fill="#fff0cf" />
                  <path
                    d="m167 180 13 14 13-14zM180 194v11m0 0q-11 9-20 0m20 0q11 9 20 0"
                    fill="#514033"
                    stroke="#514033"
                    strokeWidth="2"
                  />
                </svg>
                <p>外观示例 · 实际外观由四项属性决定</p>
              </div>
            </section>
            <section className="probabilities" aria-label="初代铸造概率">
              {[
                ["60%", "普通品种", "原野 / 雪域 / 黄金 / 钻石"],
                ["30%", "黑白炫彩", "黑白渐变鬃毛"],
                ["10%", "普通炫彩", "彩虹渐变鬃毛"],
              ].map(([rate, name, text]) => (
                <article key={name}>
                  <strong>{rate}</strong>
                  <h2>{name}</h2>
                  <p>{text}</p>
                </article>
              ))}
            </section>
            <p className="footnote">
              以上为每次初代铸造概率，没有保底；繁育属性各有 50%
              概率继承任一亲代。累计铸造：
              {loading ? "读取中…" : `${collection.minted} / 10,000`}； 当前存量：
              {loading ? "读取中…" : collection.supply}。
            </p>
            <section className="story-grid" aria-label="炫彩狮的故事">
              <SpeciesStory species={5} />
              <SpeciesStory species={4} />
            </section>
          </>
        )}
        {page === "market" && (
          <MarketPage
            account={account}
            refresh={refresh}
            busy={busy}
            onAction={perform}
            onConnect={connectWallet}
            onDetail={(lion) => {
              setDetail(lion);
              setNotice(null);
            }}
          />
        )}
        {["collection", "breed"].includes(page) && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">
                  {page === "breed"
                    ? "CREATE THE NEXT GENERATION"
                    : "OWNED BY YOUR WALLET"}
                </p>
                <h1>{page === "breed" ? "新一代，从这里开始。" : "我的狮群"}</h1>
              </div>
              <button disabled={busy || loading} onClick={() => setRefresh((n) => n + 1)}>
                刷新收藏
              </button>
            </div>
            {!account ? (
              <div className="empty">
                <PawPrint size={40} />
                <h2>连接钱包，查看你的狮子</h2>
                <p>收藏来自区块链，跟随钱包地址。</p>
                <button className="primary" onClick={connectWallet} disabled={busy}>
                  连接钱包
                </button>
              </div>
            ) : (
              <>
                {page === "breed" && (
                  <section className="breed-panel">
                    <h2>选择两只亲代</h2>
                    <p>
                      每项外观各有 50%
                      概率继承任一亲代，无隐藏基因或变异。代数为双亲较高代数 +1，冷却 5
                      分钟。
                    </p>
                    <div className="parent-selectors">
                      {[
                        ["选择亲代 A", parentA, setParentA],
                        ["选择亲代 B", parentB, setParentB],
                      ].map(([label, value, setter]) => (
                        <label key={label}>
                          {label}
                          <select
                            aria-label={label}
                            value={value}
                            disabled={busy || loading}
                            onChange={(event) => setter(event.target.value)}
                          >
                            <option value="">请选择</option>
                            {collection.lions.map((lion) => (
                              <option value={lion.id} key={lion.id}>
                                #{lion.id} · {traitLabels(lion)[0][1]} · Gen{" "}
                                {lion.generation}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                    <button
                      className="primary"
                      disabled={busy || loading || !a || !b || a.id === b.id || wait > 0}
                      onClick={() => perform("breed", [a.id, b.id])}
                    >
                      {busy ? "处理中…" : wait ? `冷却中 · ${wait} 秒` : "繁育新狮子"}
                    </button>
                    {a && b && a.id === b.id && (
                      <p role="alert">请选择两只不同的狮子。</p>
                    )}
                  </section>
                )}
                <p className="collection-count">
                  已加载 {collection.lions.length} / {collection.total} 只
                  {loading && " · 读取中…"}
                </p>
                {!loading && !loadError && collection.total === 0 && (
                  <div className="empty">
                    <h2>还没有狮子</h2>
                    <p>铸造你的第一只 NFT，之后可以转赠或繁育。</p>
                    <button onClick={() => setPage("mint")}>去铸造</button>
                  </div>
                )}
                <div className="lion-grid">
                  {collection.lions.map((lion) => (
                    <button
                      className="lion-card"
                      key={lion.id}
                      disabled={busy}
                      onClick={() => {
                        setDetail(lion);
                        setRecipient("");
                        setSalePrice("");
                        setNotice(null);
                      }}
                    >
                      <div className="card-art">
                        <span className="badge">{rarityOf(lion)}</span>
                        <img
                          src={lion.image}
                          alt={`狮子 #${lion.id}，${traitLabels(lion)[0][1]}`}
                        />
                      </div>
                      <div className="card-info">
                        <strong>狮子 #{lion.id}</strong>
                        <span>Gen {lion.generation}</span>
                        <p>
                          {traitLabels(lion)[0][1]} <ArrowUpRight size={17} />
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                {collection.lions.length < collection.total && (
                  <button
                    className="load-more"
                    disabled={busy || loading}
                    onClick={() => setLimit((n) => n + 12)}
                  >
                    加载更多狮子（繁育可选）
                  </button>
                )}
              </>
            )}
          </>
        )}
      </main>
      <footer>
        <span>LIONVERSE · 课程测试网项目</span>
        {EXPLORER && CONFIGURED && (
          <a href={`${EXPLORER}/address/${ADDRESS}`} target="_blank" rel="noreferrer">
            查看合约 ↗
          </a>
        )}
        <span>React · Ethers.js · ERC-721</span>
      </footer>
      {detail && (
        <Modal
          title={`狮子 #${detail.id} 详情`}
          busy={busy}
          close={() => setDetail(null)}
        >
          <div className="detail-layout">
            <div className="detail-art">
              <img src={detail.image} alt={`狮子 #${detail.id}`} />
            </div>
            <div className="detail-content">
              {notice && (
                <div
                  role={notice.error ? "alert" : "status"}
                  className={notice.error ? "notice error" : "notice"}
                >
                  {notice.text}
                  {hash &&
                    (EXPLORER ? (
                      <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer">
                        查看交易 ↗
                      </a>
                    ) : (
                      <small>交易：{hash}</small>
                    ))}
                </div>
              )}
              <p className="eyebrow">
                {rarityOf(detail)} · GEN {detail.generation}
              </p>
              <h2>狮子 #{detail.id}</h2>
              <dl>
                {traitLabels(detail).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <SpeciesStory species={detail.species} />
              <p className="owner">
                {detail.burned ? (
                  "已销毁 · 历史记录"
                ) : (
                  <>
                    {detail.listing ? "卖家：" : "主人："}
                    <span title={detail.listing?.seller || detail.owner}>
                      {shortAddress(detail.listing?.seller || detail.owner)}
                    </span>
                  </>
                )}
              </p>
              <p>出生：{new Date(detail.bornAt * 1000).toLocaleString()}</p>
              <div className="parents">
                父母：
                {detail.parentA ? (
                  <>
                    <button disabled={busy} onClick={() => showParent(detail.parentA)}>
                      #{detail.parentA}
                    </button>{" "}
                    ×{" "}
                    <button disabled={busy} onClick={() => showParent(detail.parentB)}>
                      #{detail.parentB}
                    </button>
                  </>
                ) : (
                  "初代"
                )}
              </div>
              <p>
                繁育状态：
                {detail.burned
                  ? "已销毁，不能繁育"
                  : detail.listing
                    ? "挂单中，请先撤单"
                    : detail.nextBreedAt * 1000 > now
                      ? `冷却中 · ${Math.ceil((detail.nextBreedAt * 1000 - now) / 1000)} 秒`
                      : "可以繁育"}
              </p>
              {EXPLORER && (
                <a
                  href={`${EXPLORER}/token/${ADDRESS}?a=${detail.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  在 Etherscan 查看 ↗
                </a>
              )}
              {ownDetail && (
                <>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      perform("transfer", [recipient, detail.id]);
                    }}
                  >
                    <label htmlFor="recipient">转赠到钱包地址</label>
                    <input
                      id="recipient"
                      placeholder="0x…"
                      value={recipient}
                      disabled={busy}
                      onChange={(event) => setRecipient(event.target.value)}
                      required
                    />
                    <button className="primary" disabled={busy || !recipient}>
                      转赠 NFT
                    </button>
                  </form>
                  {MARKET_CONFIGURED && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        perform("list", [detail.id, salePrice]);
                      }}
                    >
                      <label htmlFor="sale-price">挂单价格（ETH）</label>
                      <input
                        id="sale-price"
                        inputMode="decimal"
                        placeholder="例如 0.01"
                        value={salePrice}
                        onChange={(event) => setSalePrice(event.target.value)}
                        disabled={busy}
                        required
                      />
                      <p>
                        上架需要授权和挂单两笔交易。挂单期间 NFT
                        由市场合约暂存，不能繁育；撤单后返还。
                      </p>
                      <button className="primary" disabled={busy || !salePrice}>
                        上架出售
                      </button>
                    </form>
                  )}
                  <div className="burn-section">
                    <p>永久销毁会移除 NFT 所有权，不返还 ETH，也不会补回铸造额度。</p>
                    <button
                      className="danger-button"
                      disabled={busy}
                      onClick={() => {
                        setBurnTarget(detail);
                        setBurnInput("");
                        setDetail(null);
                        setNotice(null);
                      }}
                    >
                      销毁 NFT
                    </button>
                  </div>
                </>
              )}
              {detail.listing && (
                <div className="market-offer">
                  <strong>挂单价：{formatEther(detail.listing.price)} ETH</strong>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() =>
                      perform(
                        detail.listing.seller.toLowerCase() === account.toLowerCase()
                          ? "cancel"
                          : "buy",
                        detail.listing.seller.toLowerCase() === account.toLowerCase()
                          ? [detail.id]
                          : [detail.id, detail.listing.price],
                      )
                    }
                  >
                    {detail.listing.seller.toLowerCase() === account.toLowerCase()
                      ? "撤销挂单"
                      : "购买 NFT"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
      {burnTarget && (
        <Modal
          title={`确认销毁狮子 #${burnTarget.id}`}
          busy={busy}
          close={() => {
            setDetail(burnTarget);
            setBurnTarget(null);
            setBurnInput("");
          }}
        >
          <div className="burn-confirm">
            <h2>永久销毁狮子 #{burnTarget.id}</h2>
            <p>
              此操作不可撤销。狮子将从收藏中移除，不能再转赠、交易或繁育。历史属性和父母记录仍保留；没有退款或奖励。
            </p>
            {notice && (
              <div className="notice error" role={notice.error ? "alert" : "status"}>
                {notice.text}
              </div>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (burnInput === String(burnTarget.id)) perform("burn", [burnTarget.id]);
              }}
            >
              <label htmlFor="burn-confirm-id">输入编号 {burnTarget.id} 确认销毁</label>
              <input
                id="burn-confirm-id"
                inputMode="numeric"
                autoComplete="off"
                value={burnInput}
                onChange={(event) => setBurnInput(event.target.value)}
                disabled={busy}
              />
              <button
                className="danger-button"
                disabled={busy || burnInput !== String(burnTarget.id)}
              >
                {busy ? "等待钱包确认…" : "确认永久销毁"}
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
