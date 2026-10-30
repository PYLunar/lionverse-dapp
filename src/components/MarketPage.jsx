import { useEffect, useState } from "react";
import {
  formatEther,
  friendlyError,
  loadMarket,
  MARKET_CONFIGURED,
} from "../services/blockchain.js";
import { rarityOf, shortAddress, traitLabels } from "../domain/catalog.js";

export default function MarketPage({
  account,
  refresh,
  busy,
  onAction,
  onDetail,
  onConnect,
}) {
  const [data, setData] = useState({ lions: [], total: 0, proceeds: "0" });
  const [limit, setLimit] = useState(12);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    loadMarket(account, limit)
      .then((value) => {
        if (!cancelled) setData(value);
      })
      .catch((reason) => {
        if (!cancelled) setError(friendlyError(reason));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [account, refresh, retry, limit]);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">FIXED PRICE · TEST ETH</p>
          <h1>Lion Marketplace</h1>
        </div>
        <button disabled={busy || loading} onClick={() => setRetry((n) => n + 1)}>
          Refresh market
        </button>
      </div>
      <p className="footnote">
        Trade at fixed prices in test ETH with no platform fee. The marketplace holds
        listed NFTs until a sale or cancellation. Open a lion's details in My Pride to
        list it.
      </p>
      {account ? (
        <div className="market-balance">
          <div>
            Available proceeds<strong>{formatEther(data.proceeds)} ETH</strong>
          </div>
          <button
            className="primary"
            disabled={busy || loading || !!error || data.proceeds === "0"}
            onClick={() => onAction("withdraw")}
          >
            Withdraw Proceeds
          </button>
        </div>
      ) : (
        <p>
          <button onClick={onConnect} disabled={busy}>
            Connect Wallet to Trade
          </button>
        </p>
      )}
      {!MARKET_CONFIGURED && (
        <p className="notice">Please deploy the marketplace first.</p>
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {loading && <p role="status">Loading on-chain listings…</p>}
      {!loading && !error && data.lions.length === 0 && (
        <div className="empty">
          <h2>No listings yet</h2>
          <p>Set an ETH price for a lion in My Pride. Your listing will appear here.</p>
        </div>
      )}
      <div className="lion-grid">
        {!loading &&
          !error &&
          data.lions.map((lion) => {
            const own =
              account && lion.listing.seller.toLowerCase() === account.toLowerCase();
            return (
              <article className="market-card" key={lion.id}>
                <button
                  className="lion-card"
                  disabled={busy}
                  onClick={() => onDetail(lion)}
                >
                  <div className="card-art">
                    <span className="badge">{rarityOf(lion)}</span>
                    <img src={lion.image} alt={`Lion #${lion.id}`} />
                  </div>
                  <div className="card-info">
                    <strong>Lion #{lion.id}</strong>
                    <p>{traitLabels(lion)[0][1]}</p>
                  </div>
                </button>
                <div className="market-offer">
                  <strong>{formatEther(lion.listing.price)} ETH</strong>
                  <small>
                    {own ? "Your listing" : `Seller ${shortAddress(lion.listing.seller)}`}
                  </small>
                  <button
                    className={own ? "" : "primary"}
                    disabled={busy}
                    onClick={() =>
                      onAction(
                        own ? "cancel" : "buy",
                        own ? [lion.id] : [lion.id, lion.listing.price],
                      )
                    }
                  >
                    {own ? "Cancel Listing" : "Buy NFT"}
                  </button>
                </div>
              </article>
            );
          })}
      </div>
      {data.lions.length < data.total && !loading && !error && (
        <button
          className="load-more"
          disabled={busy}
          onClick={() => setLimit((n) => n + 12)}
        >
          Load more listings
        </button>
      )}
    </>
  );
}
