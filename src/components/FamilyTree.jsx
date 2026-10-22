import LionPortrait from "../LionPortrait.jsx";
import { lionName, tokenNumber, SPECIES, shortAddress } from "../domain/catalog.js";
import { CHILD_PAGE_SIZE } from "../domain/lineage.js";

function FamilyCard({ lion, onSelect, root = false }) {
  return (
    <button
      className={`family-card palette-${lion.fur} ${root ? "family-root" : ""}`}
      onClick={() => onSelect(lion.id)}
      aria-label={`追溯${lionName(lion)} ${tokenNumber(lion.id)}`}
    >
      <LionPortrait lion={lion} decorative />
      <strong>
        {lionName(lion)} <span>{tokenNumber(lion.id)}</span>
      </strong>
      <small>
        {SPECIES[lion.species].name} · Gen {lion.generation}
      </small>
      <small>{shortAddress(lion.owner)}</small>
    </button>
  );
}

function Ancestor({ node, onSelect, root = false }) {
  return (
    <li>
      <FamilyCard lion={node.lion} onSelect={onSelect} root={root} />
      {node.parents.length > 0 && (
        <ul>
          {node.parents.map((parent, index) => (
            <Ancestor
              key={`${parent.lion.id}-${index}`}
              node={parent}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Two ancestry levels per view; selecting a node continues further back without unbounded RPCs. */
export default function FamilyTree({ data, onSelect, onPage, onDetail }) {
  return (
    <section className="family-section">
      <div className="section-title">
        <div>
          <h2>{lionName(data.tree.lion)}的家谱</h2>
          <p>展示父母与祖辈，点击任意成员继续追溯；转赠不会改变血缘。</p>
        </div>
        <button className="secondary-button" onClick={() => onDetail(data.tree.lion)}>
          查看藏品
        </button>
      </div>
      <div className="family-scroll" tabIndex={0} role="region" aria-label="祖辈家谱">
        <ul className="ancestry-tree">
          <Ancestor node={data.tree} onSelect={onSelect} root />
        </ul>
      </div>
      {!data.tree.parents.length && (
        <p className="pagination-note">这是一只初代狮子，没有亲代记录。</p>
      )}
      <h3 className="children-title">
        直系子代 <span>{data.childTotal}</span>
      </h3>
      {data.children.length ? (
        <div className="children-grid">
          {data.children.map((lion) => (
            <FamilyCard key={lion.id} lion={lion} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <p className="pagination-note">还没有直系子代，新的家族故事等待开始。</p>
      )}
      {data.childTotal > CHILD_PAGE_SIZE && (
        <div className="family-pagination">
          <button
            className="secondary-button"
            disabled={data.childOffset === 0}
            onClick={() => onPage(Math.max(0, data.childOffset - CHILD_PAGE_SIZE))}
          >
            上一页
          </button>
          <span>
            {data.childOffset + 1}–
            {Math.min(data.childTotal, data.childOffset + CHILD_PAGE_SIZE)} /{" "}
            {data.childTotal}
          </span>
          <button
            className="secondary-button"
            disabled={data.childOffset + CHILD_PAGE_SIZE >= data.childTotal}
            onClick={() => onPage(data.childOffset + CHILD_PAGE_SIZE)}
          >
            下一页
          </button>
        </div>
      )}
    </section>
  );
}
