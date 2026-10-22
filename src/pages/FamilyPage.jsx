import { useMemo, useState } from "react";
import { demoRepository, summarizeAlbum } from "../domain/lineage.js";
import { LOCI } from "../domain/genetics.js";
import { lionName, tokenNumber } from "../domain/catalog.js";
import { loadLion, loadChildren, CONFIGURED } from "../services/blockchain.js";
import useFamily from "../hooks/useFamily.js";
import useAlbum from "../hooks/useAlbum.js";
import FamilyTree from "../components/FamilyTree.jsx";
import Spinner from "../components/Spinner.jsx";

const chainRepository = { getLion: loadLion, getChildren: loadChildren };

export default function FamilyPage({
  mode,
  wallet,
  demo,
  rootId,
  onRoot,
  onDetail,
  connectWallet,
  busy,
}) {
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [retry, setRetry] = useState(0);
  const [inputError, setInputError] = useState("");
  const repository = useMemo(
    () => (mode === "demo" ? demoRepository(demo) : chainRepository),
    [mode, demo],
  );
  const family = useFamily(rootId, repository, offset, retry);
  const album = useAlbum(mode, wallet, demo, retry);
  const discoveries = useMemo(() => summarizeAlbum(album.lions, LOCI), [album.lions]);
  const expressed = discoveries.reduce(
    (sum, locus) => sum + locus.entries.filter((entry) => entry.expressed).length,
    0,
  );
  const carried = discoveries.reduce(
    (sum, locus) =>
      sum + locus.entries.filter((entry) => entry.carried && !entry.expressed).length,
    0,
  );
  const total = LOCI.reduce((sum, locus) => sum + locus.names.length, 0);
  function select(id) {
    setOffset(0);
    setInputError("");
    onRoot(Number(id));
  }
  return (
    <div className="family-page">
      <section className="family-search">
        <h2>沿着基因，寻找家族的故事。</h2>
        <p>可以查询任何编号，不受当前主人和收藏列表分页限制。</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const id = Number(query.replace(/^#/, ""));
            if (!Number.isSafeInteger(id) || id < 1 || id > 10000) {
              setInputError("请输入 1–10000 之间的藏品编号。");
              return;
            }
            select(id);
          }}
        >
          <label className="sr-only" htmlFor="family-id">
            家谱编号
          </label>
          <input
            id="family-id"
            placeholder="输入藏品编号，例如 7"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="primary-button" disabled={mode === "chain" && !CONFIGURED}>
            查询家谱
          </button>
          <label className="sr-only" htmlFor="family-owned">
            从我的狮群选择
          </label>
          <select
            id="family-owned"
            value={album.lions.some((lion) => lion.id === rootId) ? rootId : ""}
            onChange={(event) => {
              if (event.target.value) select(event.target.value);
            }}
          >
            <option value="">从我的狮群选择</option>
            {album.lions.map((lion) => (
              <option key={lion.id} value={lion.id}>
                {lionName(lion)} {tokenNumber(lion.id)}
              </option>
            ))}
          </select>
        </form>
        {inputError && (
          <p role="alert" className="inline-error">
            {inputError}
          </p>
        )}
      </section>
      {family.loading && (
        <div className="empty-state" role="status">
          <Spinner />
          正在读取家谱…
        </div>
      )}
      {family.error && (
        <div className="inline-error" role="alert">
          {family.error}
          <button onClick={() => setRetry((value) => value + 1)}>重试</button>
        </div>
      )}
      {family.data && (
        <FamilyTree
          data={family.data}
          onSelect={select}
          onPage={setOffset}
          onDetail={onDetail}
        />
      )}
      {!rootId && (
        <div className="empty-state">
          <h3>选择一只狮子，展开家谱</h3>
          <p>也可以从藏品详情点击“查看家谱”。</p>
        </div>
      )}
      <section className="collection-album">
        <div className="section-title">
          <div>
            <h2>我的基因图鉴</h2>
            <p>依据当前自有藏品计算，转赠后刷新会更新；不是永久成就。</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => setRetry((value) => value + 1)}
          >
            刷新图鉴
          </button>
        </div>
        <div className="album-stats">
          <span>
            已显现{" "}
            <strong>
              {expressed} / {total}
            </strong>
          </span>
          <span>
            仅携带 <strong>{carried}</strong>
          </span>
          <span>
            已读取{" "}
            <strong>
              {album.lions.length} / {album.total} 只
            </strong>
          </span>
        </div>
        {album.loading && (
          <p className="pagination-note" role="status">
            正在分批读取完整收藏，当前统计尚未完成…
          </p>
        )}
        {album.error && (
          <p className="inline-error" role="alert">
            {album.error}
          </p>
        )}
        {mode === "chain" && !wallet && (
          <button className="secondary-button" onClick={connectWallet} disabled={busy}>
            连接钱包以查看个人图鉴
          </button>
        )}
        <div className="album-legend">
          <span>● 已显现</span>
          <span>◐ 仅携带</span>
          <span>○ 未收录</span>
        </div>
        {discoveries.map((locus) => (
          <div className="album-row" key={locus.key}>
            <h3>{locus.label}</h3>
            <div>
              {locus.entries.map((entry) => (
                <span
                  key={entry.name}
                  className={`album-entry ${entry.expressed ? "expressed" : entry.carried ? "carried" : "unknown"}`}
                >
                  {entry.expressed ? "●" : entry.carried ? "◐" : "○"} {entry.name}
                  <span className="sr-only">
                    {entry.expressed ? "已显现" : entry.carried ? "仅携带" : "未收录"}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
