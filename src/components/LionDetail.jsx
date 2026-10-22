import { Heart, Copy, ExternalLink, Dna, ArrowRight, GitFork } from "lucide-react";
import Modal from "./Modal.jsx";
import Badge from "./Badge.jsx";
import Spinner from "./Spinner.jsx";
import GenePanel from "./GenePanel.jsx";
import LionPortrait from "../LionPortrait.jsx";
import {
  lionName,
  lionEnglish,
  tokenNumber,
  traits,
  shortAddress,
} from "../domain/catalog.js";
import { NETWORK, EXPLORER, ADDRESS } from "../services/blockchain.js";

export default function LionDetail({
  detail,
  setDetail,
  busy,
  newborn,
  mode,
  isOwned,
  now,
  tell,
  recipient,
  setRecipient,
  perform,
  navigate,
  startBreeding,
  setFamilyRoot,
}) {
  return (
    <Modal
      title={`${lionName(detail)}的藏品详情`}
      close={() => setDetail(null)}
      busy={busy}
    >
      <div className={`detail-art palette-${detail.fur}`}>
        <span className="detail-tag">
          {newborn ? "✦ 很高兴，遇见你" : `LIONVERSE ${tokenNumber(detail.id)}`}
        </span>
        <div className="art-halo" />
        <LionPortrait lion={detail} />
        <Badge rarity={detail.rarity} />
      </div>
      <div className="detail-body">
        <div className="detail-title">
          <div>
            <h2>
              {lionName(detail)} <span>{lionEnglish(detail)}</span>
            </h2>
            <p>
              {tokenNumber(detail.id)} · GEN {detail.generation} ·{" "}
              {mode === "demo" ? "演示藏品" : NETWORK}
            </p>
          </div>
          <Heart size={22} />
        </div>
        <div className="traits-grid">
          {traits(detail).map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <GenePanel lion={detail} />
        <button
          className="secondary-button family-detail-link"
          onClick={() => {
            setFamilyRoot(detail.id);
            setDetail(null);
            navigate("family");
          }}
          disabled={busy}
        >
          <GitFork size={16} />
          查看家谱
        </button>
        <div className="detail-meta">
          <div>
            <span>当前主人</span>
            <strong>{isOwned(detail) ? "你" : shortAddress(detail.owner)}</strong>
          </div>
          <div>
            <span>出生日期</span>
            <strong>{new Date(detail.bornAt * 1000).toLocaleDateString("zh-CN")}</strong>
          </div>
          <div>
            <span>双亲</span>
            <strong>
              {detail.parentA
                ? `${tokenNumber(detail.parentA)} × ${tokenNumber(detail.parentB)}`
                : "初代 · 自然诞生"}
            </strong>
          </div>
          <div>
            <span>繁育状态</span>
            <strong>
              {detail.nextBreedAt > now / 1000
                ? `休息中 · ${Math.ceil(detail.nextBreedAt - now / 1000)} 秒`
                : "可以繁育"}
            </strong>
          </div>
          <div>
            <span>基因 DNA</span>
            <button
              className="dna-copy"
              title={detail.dna}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(detail.dna);
                  tell("DNA 已复制", "success");
                } catch {
                  tell("无法访问剪贴板，请从提示文本复制 DNA。", "error");
                }
              }}
            >
              {detail.dna.slice(0, 13)}…<Copy size={12} />
            </button>
          </div>
        </div>
        {mode === "chain" && EXPLORER && (
          <a
            className="explorer-link"
            href={`${EXPLORER}/token/${ADDRESS}?a=${detail.id}`}
            target="_blank"
            rel="noreferrer"
          >
            在 Etherscan 查看藏品 <ExternalLink size={13} />
          </a>
        )}
        {isOwned(detail) && mode === "chain" && (
          <form
            className="transfer-form"
            onSubmit={(e) => {
              e.preventDefault();
              perform("transfer", [recipient, detail.id]);
            }}
          >
            <label htmlFor="recipient">转赠给另一位收藏者</label>
            <div>
              <input
                id="recipient"
                placeholder="接收钱包地址 0x…"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={busy}
                required
              />
              <button className="secondary-button" disabled={busy || !recipient.trim()}>
                {busy ? <Spinner /> : "转赠"}
              </button>
            </div>
            <small>确认地址后，在钱包签名；成功后所有权会转移。</small>
          </form>
        )}
        {isOwned(detail) && (
          <button
            className="primary-button wide"
            disabled={busy}
            onClick={() => startBreeding(detail)}
          >
            <Dna size={17} />
            去繁育小屋
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </Modal>
  );
}
