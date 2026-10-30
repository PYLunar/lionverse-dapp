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
  ["mint", "Mint"],
  ["collection", "My Pride"],
  ["breed", "Breed"],
  ["market", "Marketplace"],
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
        setNotice({ error: true, text: `Please connect to ${NETWORK}.` });
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
            transfer: "Transfer confirmed on-chain.",
            list: "NFT listed. Withdraw your proceeds from the marketplace after a sale.",
            buy: "Purchase complete. The NFT is now in your wallet.",
            cancel: "Listing canceled. The NFT is back in your wallet.",
            withdraw: "Sale proceeds withdrawn to your wallet.",
            burn: "NFT permanently burned. Historical traits and parent records remain available.",
          }[action] ||
          (result.lion
            ? "A new lion is born on-chain!"
            : "Mint confirmed. Details are temporarily unavailable; please refresh your collection."),
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
          <PawPrint size={25} /> Lionverse
        </a>
        <nav aria-label="Main navigation">
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
          {account ? shortAddress(account) : "Connect Wallet"}
        </button>
      </header>
      <main>
        <div className="network-line">
          <span className="network-dot" />
          {NETWORK}
          <span>
            {CONFIGURED ? `Contract ${shortAddress(ADDRESS)}` : "Contract not deployed"}
          </span>
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
                  View transaction ↗
                </a>
              ) : (
                <small>Transaction: {hash}</small>
              ))}
          </div>
        )}
        {loadError && (
          <div role="alert" className="notice error">
            {loadError}
            <button onClick={() => setRefresh((n) => n + 1)} disabled={loading}>
              Retry
            </button>
          </div>
        )}
        {!CONFIGURED && (
          <p className="notice">
            Deploy the contracts using the README, then start the frontend.
          </p>
        )}
        {page === "mint" && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">FOUR TRAITS. ONE LION.</p>
                <h1>
                  Meet your
                  <br />
                  on-chain lion.
                </h1>
                <p>
                  Four traits. A collection owned by your wallet. Mint, breed or transfer
                  a lion, with every step recorded on-chain.
                </p>
                <button
                  className="primary"
                  disabled={busy || !CONFIGURED}
                  onClick={() => perform("mint")}
                >
                  {busy ? "Processing…" : account ? "Mint a Lion" : "Connect & Mint"}
                </button>
                <small>
                  Free mint · Network gas only · 5-minute cooldown for every new lion
                </small>
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
                <p>Preview · Each lion's appearance is defined by four traits</p>
              </div>
            </section>
            <section className="probabilities" aria-label="Founder mint probabilities">
              {[
                ["60%", "Classic", "Savanna / Snow / Golden / Diamond"],
                ["30%", "Monochrome", "Black-and-white gradient mane"],
                ["10%", "Rainbow", "Rainbow gradient mane"],
              ].map(([rate, name, text]) => (
                <article key={name}>
                  <strong>{rate}</strong>
                  <h2>{name}</h2>
                  <p>{text}</p>
                </article>
              ))}
            </section>
            <p className="footnote">
              These odds apply to each founder mint, with no guaranteed rare drop. Each
              bred trait has a 50% chance of coming from either parent. Total minted:{" "}
              {loading ? "Loading…" : `${collection.minted} / 10,000`}. Active supply:{" "}
              {loading ? "Loading…" : collection.supply}.
            </p>
            <section className="story-grid" aria-label="Special lion stories">
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
                <h1>
                  {page === "breed" ? "The next generation starts here." : "My Pride"}
                </h1>
              </div>
              <button disabled={busy || loading} onClick={() => setRefresh((n) => n + 1)}>
                Refresh collection
              </button>
            </div>
            {!account ? (
              <div className="empty">
                <PawPrint size={40} />
                <h2>Connect your wallet to see your lions</h2>
                <p>Your collection is stored on-chain and follows your wallet address.</p>
                <button className="primary" onClick={connectWallet} disabled={busy}>
                  Connect Wallet
                </button>
              </div>
            ) : (
              <>
                {page === "breed" && (
                  <section className="breed-panel">
                    <h2>Choose two parents</h2>
                    <p>
                      Each trait has a 50% chance of coming from either parent. There are
                      no hidden genes or mutations. The child's generation is the higher
                      parent generation + 1. Breeding has a 5-minute cooldown.
                    </p>
                    <div className="parent-selectors">
                      {[
                        ["Select parent A", parentA, setParentA],
                        ["Select parent B", parentB, setParentB],
                      ].map(([label, value, setter]) => (
                        <label key={label}>
                          {label}
                          <select
                            aria-label={label}
                            value={value}
                            disabled={busy || loading}
                            onChange={(event) => setter(event.target.value)}
                          >
                            <option value="">Choose a lion</option>
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
                      {busy
                        ? "Processing…"
                        : wait
                          ? `Resting · ${wait}s`
                          : "Breed a Lion"}
                    </button>
                    {a && b && a.id === b.id && (
                      <p role="alert">Please choose two different lions.</p>
                    )}
                  </section>
                )}
                <p className="collection-count">
                  Loaded {collection.lions.length} / {collection.total} lions
                  {loading && " · Loading…"}
                </p>
                {!loading && !loadError && collection.total === 0 && (
                  <div className="empty">
                    <h2>No lions yet</h2>
                    <p>Mint your first NFT, then transfer it or breed a new lion.</p>
                    <button onClick={() => setPage("mint")}>Start minting</button>
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
                          alt={`Lion #${lion.id}, ${traitLabels(lion)[0][1]}`}
                        />
                      </div>
                      <div className="card-info">
                        <strong>Lion #{lion.id}</strong>
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
                    Load more lions for breeding
                  </button>
                )}
              </>
            )}
          </>
        )}
      </main>
      <footer>
        <span>LIONVERSE · Testnet Coursework Project</span>
        {EXPLORER && CONFIGURED && (
          <a href={`${EXPLORER}/address/${ADDRESS}`} target="_blank" rel="noreferrer">
            View contract ↗
          </a>
        )}
        <span>React · Ethers.js · ERC-721</span>
      </footer>
      {detail && (
        <Modal
          title={`Lion #${detail.id} details`}
          busy={busy}
          close={() => setDetail(null)}
        >
          <div className="detail-layout">
            <div className="detail-art">
              <img src={detail.image} alt={`Lion #${detail.id}`} />
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
                        View transaction ↗
                      </a>
                    ) : (
                      <small>Transaction: {hash}</small>
                    ))}
                </div>
              )}
              <p className="eyebrow">
                {rarityOf(detail)} · GEN {detail.generation}
              </p>
              <h2>Lion #{detail.id}</h2>
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
                  "Burned · Historical record"
                ) : (
                  <>
                    {detail.listing ? "Seller: " : "Owner: "}
                    <span title={detail.listing?.seller || detail.owner}>
                      {shortAddress(detail.listing?.seller || detail.owner)}
                    </span>
                  </>
                )}
              </p>
              <p>Born: {new Date(detail.bornAt * 1000).toLocaleString("en-GB")}</p>
              <div className="parents">
                Parents:{" "}
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
                  "Founder"
                )}
              </div>
              <p>
                Breeding status:{" "}
                {detail.burned
                  ? "Burned; cannot breed"
                  : detail.listing
                    ? "Listed; cancel the listing first"
                    : detail.nextBreedAt * 1000 > now
                      ? `Resting · ${Math.ceil((detail.nextBreedAt * 1000 - now) / 1000)}s`
                      : "Ready to breed"}
              </p>
              {EXPLORER && (
                <a
                  href={`${EXPLORER}/token/${ADDRESS}?a=${detail.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Etherscan ↗
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
                    <label htmlFor="recipient">Recipient wallet address</label>
                    <input
                      id="recipient"
                      placeholder="0x…"
                      value={recipient}
                      disabled={busy}
                      onChange={(event) => setRecipient(event.target.value)}
                      required
                    />
                    <button className="primary" disabled={busy || !recipient}>
                      Transfer NFT
                    </button>
                  </form>
                  {MARKET_CONFIGURED && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        perform("list", [detail.id, salePrice]);
                      }}
                    >
                      <label htmlFor="sale-price">Listing price (ETH)</label>
                      <input
                        id="sale-price"
                        inputMode="decimal"
                        placeholder="e.g. 0.01"
                        value={salePrice}
                        onChange={(event) => setSalePrice(event.target.value)}
                        disabled={busy}
                        required
                      />
                      <p>
                        Listing requires approval and listing transactions. The
                        marketplace holds your NFT while listed, so it cannot breed.
                        Cancel to return it to your wallet.
                      </p>
                      <button className="primary" disabled={busy || !salePrice}>
                        List for Sale
                      </button>
                    </form>
                  )}
                  <div className="burn-section">
                    <p>
                      Burning permanently removes ownership. It does not refund ETH or
                      restore minting capacity.
                    </p>
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
                      Burn NFT
                    </button>
                  </div>
                </>
              )}
              {detail.listing && (
                <div className="market-offer">
                  <strong>Price: {formatEther(detail.listing.price)} ETH</strong>
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
                      ? "Cancel Listing"
                      : "Buy NFT"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
      {burnTarget && (
        <Modal
          title={`Confirm burning Lion #${burnTarget.id}`}
          busy={busy}
          close={() => {
            setDetail(burnTarget);
            setBurnTarget(null);
            setBurnInput("");
          }}
        >
          <div className="burn-confirm">
            <h2>Permanently burn Lion #{burnTarget.id}</h2>
            <p>
              This cannot be undone. The lion will leave your collection and can no longer
              be transferred, traded or bred. Historical traits and parent records remain
              available. There is no refund or reward.
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
              <label htmlFor="burn-confirm-id">
                Enter ID {burnTarget.id} to confirm burning
              </label>
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
                {busy ? "Waiting for wallet confirmation…" : "Confirm Permanent Burn"}
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
