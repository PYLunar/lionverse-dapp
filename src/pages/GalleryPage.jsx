import { Plus, ArrowDownUp, Search, ChevronDown, PawPrint } from "lucide-react";
import { CONFIGURED } from "../services/blockchain.js";
import { RARITIES } from "../domain/catalog.js";
import Spinner from "../components/Spinner.jsx";
import LionCard from "../components/LionCard.jsx";

export default function GalleryPage({
  page,
  mode,
  visibleLions,
  chainTotal,
  busy,
  setMintOpen,
  rarity,
  setRarity,
  query,
  setQuery,
  sort,
  setSort,
  chainLions,
  loadError,
  setRefresh,
  loading,
  filtered,
  isOwned,
  openDetail,
  ownedPage,
  wallet,
  connectWallet,
  setOffset,
}) {
  return (
    <section className="gallery-section">
      <div className="section-title">
        <div>
          <h2>
            {page === "explore" ? "遇见狮屿居民" : "属于你的狮子"}
            <span className="count-pill">
              {mode === "demo" ? visibleLions.length : chainTotal}
            </span>
          </h2>
          <p>
            {page === "explore"
              ? "黄金、钻石、炫彩，还有藏在基因里的小小惊喜。"
              : "点击小伙伴，查看基因、家谱与链上归属。"}
          </p>
        </div>
        {page === "collection" ? (
          <button
            className="secondary-button"
            onClick={() => setMintOpen(true)}
            disabled={busy || (mode === "chain" && !CONFIGURED)}
          >
            <Plus size={16} />
            领养新伙伴
          </button>
        ) : (
          <span className="section-caption">SMALL PAWS, BIG PERSONALITIES</span>
        )}
      </div>
      <div className="gallery-toolbar">
        <div className="filter-tabs" aria-label="稀有度筛选">
          <button
            className={rarity === "all" ? "active" : ""}
            onClick={() => setRarity("all")}
          >
            全部狮子
          </button>
          {RARITIES.map((r, i) => (
            <button
              key={r.name}
              className={rarity === String(i) ? "active" : ""}
              onClick={() => setRarity(String(i))}
            >
              {r.name}
            </button>
          ))}
        </div>
        <div className="gallery-inputs">
          <label className="search-box">
            <Search size={15} />
            <input
              aria-label="搜索狮子"
              placeholder="名称、品种或编号"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="sort-box">
            <ArrowDownUp size={14} />
            <select
              aria-label="狮子排序"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="id">最新相遇</option>
              <option value="old">最早诞生</option>
              <option value="rarity">稀有优先</option>
            </select>
            <ChevronDown size={12} />
          </label>
        </div>
      </div>
      {mode === "chain" && chainLions.length > 0 && (
        <p className="pagination-note">
          已加载 {chainLions.length} / {chainTotal}{" "}
          只；搜索、筛选和排序作用于已加载的狮子。
        </p>
      )}
      {loadError && (
        <div className="inline-error" role="alert">
          {loadError}
          <button onClick={() => setRefresh((n) => n + 1)}>重试</button>
        </div>
      )}
      {loading && !chainLions.length ? (
        <div className="empty-state">
          <Spinner />
          <h3>正在寻找链上的小伙伴…</h3>
        </div>
      ) : filtered.length ? (
        <div className="lion-grid">
          {filtered.map((lion) => (
            <LionCard
              key={lion.id}
              lion={lion}
              owned={isOwned(lion)}
              onClick={openDetail}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <PawPrint size={34} />
          <h3>
            {mode === "chain" && ownedPage && !wallet
              ? "连接钱包，遇见你的狮群"
              : "这里还没有小伙伴"}
          </h3>
          <p>
            {query || rarity !== "all"
              ? "试试其他名称或稀有度。"
              : "领养第一只狮子，开启你的故事。"}
          </p>
          {mode === "chain" && !wallet && CONFIGURED && (
            <button className="secondary-button" onClick={connectWallet} disabled={busy}>
              连接钱包
            </button>
          )}
        </div>
      )}
      {mode === "chain" && chainLions.length < chainTotal && !loadError && (
        <button
          className="load-more secondary-button"
          disabled={loading}
          onClick={() => setOffset(chainLions.length)}
        >
          {loading ? <Spinner /> : <Plus size={16} />}加载更多
        </button>
      )}
    </section>
  );
}
