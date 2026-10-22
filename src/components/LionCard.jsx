import { ArrowRight } from "lucide-react";
import LionPortrait from "../LionPortrait.jsx";
import Badge from "./Badge.jsx";
import {
  lionName,
  lionEnglish,
  tokenNumber,
  SPECIES,
  TEMPERAMENTS,
  shortAddress,
} from "../domain/catalog.js";

export default function LionCard({ lion, owned, onClick }) {
  return (
    <button
      className={`lion-card palette-${lion.fur}`}
      onClick={() => onClick(lion)}
      aria-label={`查看${lionName(lion)} ${tokenNumber(lion.id)}`}
    >
      <div className="card-art">
        <div className="card-top">
          <Badge rarity={lion.rarity} />
          <span className="generation">GEN {lion.generation}</span>
        </div>
        <div className="art-halo" />
        <LionPortrait lion={lion} />
        <span className="art-star star-one">✦</span>
        <span className="art-star star-two">✧</span>
        <span className="card-preview">
          认识一下 <ArrowRight size={14} />
        </span>
      </div>
      <div className="card-info">
        <div className="card-title">
          <h3>
            {lionName(lion)} <span>{lionEnglish(lion)}</span>
          </h3>
          <span className="token-id">{tokenNumber(lion.id)}</span>
        </div>
        <p>
          {SPECIES[lion.species].name}
          <span>·</span>
          {TEMPERAMENTS[lion.temperament]}
        </p>
        <div className="card-bottom">
          <span>
            <span className={`owner-dot ${owned ? "is-owned" : ""}`} />
            {owned ? "属于你的狮子" : shortAddress(lion.owner)}
          </span>
          <ArrowRight size={16} />
        </div>
      </div>
    </button>
  );
}
