import { Dna, Heart, PawPrint, ChevronDown, Sparkles, ArrowRight } from "lucide-react";
import LionPortrait from "../LionPortrait.jsx";
import Spinner from "../components/Spinner.jsx";
import { COOLDOWN } from "../domain/constants.js";
import { lionName, tokenNumber } from "../domain/catalog.js";
import BreedingForecast from "../components/BreedingForecast.jsx";

export default function BreedingPage({
  loadError,
  setRefresh,
  a,
  b,
  parentA,
  setParentA,
  parentB,
  setParentB,
  owned,
  now,
  busy,
  mode,
  chainLions,
  chainTotal,
  loading,
  setOffset,
  resting,
  perform,
}) {
  return (
    <section className="breeding-section">
      <div className="breed-intro">
        <span className="round-icon">
          <Dna size={26} />
        </span>
        <h2>两份基因，一个新故事。</h2>
        <p>
          选择两只属于你的狮子。幼崽会继承双亲特征，
          <br />
          每项从双亲各继承一份基因，12.5% 概率重抽其中一份；炫彩另经稀有判定。
        </p>
      </div>
      {loadError && (
        <div className="inline-error" role="alert">
          {loadError}
          <button onClick={() => setRefresh((n) => n + 1)}>重试</button>
        </div>
      )}
      <div className="parents">
        {[
          [a, parentA, setParentA, "亲代 A", parentB],
          [b, parentB, setParentB, "亲代 B", parentA],
        ].map(([lion, value, setter, label, other], i) => (
          <div className="parent-wrap" key={label}>
            {i === 1 && (
              <span className="parent-plus">
                <Heart size={22} />
              </span>
            )}
            <div className={`parent-card ${lion ? `palette-${lion.fur}` : ""}`}>
              <span className="parent-label">{label}</span>
              {lion ? (
                <LionPortrait lion={lion} />
              ) : (
                <div className="parent-placeholder">
                  <PawPrint size={54} />
                  <span>等待一位小伙伴</span>
                </div>
              )}
              <label className="parent-select">
                <span className="sr-only">选择{label}</span>
                <select
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  disabled={busy}
                >
                  <option value="">选择一只狮子</option>
                  {owned
                    .filter((l) => String(l.id) !== other)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {lionName(l)} {tokenNumber(l.id)} · Gen {l.generation}
                        {l.nextBreedAt > now / 1000 ? " · 休息中" : ""}
                      </option>
                    ))}
                </select>
                <ChevronDown size={15} />
              </label>
              {lion && (
                <p className="rest-label">
                  {lion.nextBreedAt > now / 1000
                    ? `休息中 · ${Math.ceil(lion.nextBreedAt - now / 1000)} 秒`
                    : "精力充沛，可以繁育"}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {mode === "chain" && chainLions.length < chainTotal && (
        <button
          className="secondary-button load-more"
          disabled={loading}
          onClick={() => setOffset(chainLions.length)}
        >
          加载更多亲代
        </button>
      )}
      {a && b && <BreedingForecast parentA={a} parentB={b} />}
      <div className="breed-action">
        <p>
          {a && b
            ? `新伙伴将属于 Gen ${Math.max(a.generation, b.generation) + 1}，继承两位亲代的故事。`
            : owned.length < 2
              ? "繁育需要至少两只自己的狮子；新生狮子需先休息 5 分钟。"
              : "选择两位亲代，看看会发生什么。"}
        </p>
        <button
          className="primary-button"
          disabled={!a || !b || a.id === b.id || busy || resting}
          onClick={() => perform("breed", [a.id, b.id])}
        >
          {busy ? <Spinner /> : <Sparkles size={18} />}迎接新生命
          <ArrowRight size={17} />
        </button>
        <small>
          双亲和新生狮子均有 {COOLDOWN / 60} 分钟休息时间 · 免费繁育
          {mode === "chain" ? "，仅支付 Gas" : ""}
        </small>
      </div>
    </section>
  );
}
