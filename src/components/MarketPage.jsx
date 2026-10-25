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
          <h1>狮子交易市场</h1>
        </div>
        <button disabled={busy || loading} onClick={() => setRetry((n) => n + 1)}>
          刷新市场
        </button>
      </div>
      <p className="footnote">
        测试 ETH 固定价交易，平台手续费为 0。挂单时 NFT
        暂存市场合约，成交或撤单后转出。到“我的狮群”打开详情即可上架。
      </p>
      {account ? (
        <div className="market-balance">
          <div>
            待领取成交款<strong>{formatEther(data.proceeds)} ETH</strong>
          </div>
          <button
            className="primary"
            disabled={busy || loading || !!error || data.proceeds === "0"}
            onClick={() => onAction("withdraw")}
          >
            领取成交款
          </button>
        </div>
      ) : (
        <p>
          <button onClick={onConnect} disabled={busy}>
            连接钱包进行交易
          </button>
        </p>
      )}
      {!MARKET_CONFIGURED && <p className="notice">请先部署交易市场。</p>}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {loading && <p role="status">正在读取链上挂单…</p>}
      {!loading && !error && data.lions.length === 0 && (
        <div className="empty">
          <h2>暂无挂单</h2>
          <p>在“我的狮群”中为狮子设置 ETH 价格，上架后会显示在这里。</p>
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
                    <img src={lion.image} alt={`狮子 #${lion.id}`} />
                  </div>
                  <div className="card-info">
                    <strong>狮子 #{lion.id}</strong>
                    <p>{traitLabels(lion)[0][1]}</p>
                  </div>
                </button>
                <div className="market-offer">
                  <strong>{formatEther(lion.listing.price)} ETH</strong>
                  <small>
                    {own ? "你的挂单" : `卖家 ${shortAddress(lion.listing.seller)}`}
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
                    {own ? "撤销挂单" : "购买 NFT"}
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
          加载更多挂单
        </button>
      )}
    </>
  );
}
