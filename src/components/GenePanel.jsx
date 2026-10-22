import { LOCI } from "../domain/genetics.js";

/** Presentation only; allele names and dominance order come from the versioned catalog. */
export default function GenePanel({ lion }) {
  return (
    <details className="gene-panel">
      <summary>显性与隐性基因 · 查看 {LOCI.length} 组基因</summary>
      <p>
        每组含两份等位基因。普通特征按图鉴顺序优先显现；光谱倾向另经稀有判定，不保证炫彩显现。隐性基因在链上仍公开可查。
      </p>
      {lion.geneticsOrigin === "legacy-homozygous" && (
        <p className="migration-note">
          旧版演示收藏：以两份原有特征迁移，没有推测历史隐性基因。
        </p>
      )}
      <div className="gene-table-scroll">
        <table>
          <thead>
            <tr>
              <th>特征</th>
              <th>等位基因 1</th>
              <th>等位基因 2</th>
              <th>遗传状态</th>
            </tr>
          </thead>
          <tbody>
            {LOCI.map((locus, index) => {
              const [a, b] = lion.genes.slice(index * 2, index * 2 + 2);
              return (
                <tr key={locus.key}>
                  <th scope="row">{locus.label}</th>
                  <td>{locus.names[a]}</td>
                  <td>{locus.names[b]}</td>
                  <td>
                    {locus.key === "spectrum"
                      ? Math.max(a, b) > 0
                        ? "携带光谱倾向"
                        : "自然倾向"
                      : a === b
                        ? "同型"
                        : `携带${locus.names[Math.max(a, b)]}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
