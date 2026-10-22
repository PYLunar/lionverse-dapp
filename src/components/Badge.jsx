import { RARITIES } from "../domain/catalog.js";

export default function Badge({ rarity }) {
  const r = RARITIES[rarity];
  return (
    <span className={`rarity ${r.className}`}>
      <span />
      {r.name}
    </span>
  );
}
