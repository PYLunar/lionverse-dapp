import { useState } from "react";
import { formatProbability } from "../domain/catalog.js";
import {
  LOCI,
  offspringDistribution,
  spectrumChances,
  SPECTRUM_LOCUS,
} from "../domain/genetics.js";

/** Forecasts enumerate every allele/mutation outcome; spectrum has its own capped gate. */
export default function BreedingForecast({ parentA, parentB }) {
  const [locus, setLocus] = useState(0);
  const spectrum = spectrumChances(parentA, parentB);
  const distribution = offspringDistribution(parentA, parentB, locus);
  const names = LOCI[locus].names;
  const ordinary = locus !== SPECTRUM_LOCUS;
  return (
    <section className="breeding-forecast" aria-label="配对概率预览">
      <h3>这次配对，会遇见什么？</h3>
      <div className="spectrum-forecast">
        {[
          ["非炫彩品种", spectrum.regular],
          ["普通炫彩", spectrum.prismatic],
          ["黑白炫彩", spectrum.monochrome],
        ].map(([label, rate]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{formatProbability(rate)}</strong>
          </div>
        ))}
      </div>
      <p>
        炫彩总概率最高 6%。即使双亲都显现炫彩，仍有 94%
        概率诞生非炫彩狮子。黑白炫彩已计入炫彩总概率。
      </p>
      <label className="forecast-select">
        查看遗传特征
        <select
          aria-label="预览遗传特征"
          value={locus}
          onChange={(event) => setLocus(Number(event.target.value))}
        >
          {LOCI.map((definition, index) => (
            <option key={definition.key} value={index}>
              {definition.label}
            </option>
          ))}
        </select>
      </label>
      {ordinary ? (
        <>
          <div className="punnett-grid" aria-label="不计变异的四种遗传组合">
            {parentA.genes.slice(locus * 2, locus * 2 + 2).flatMap((a, i) =>
              parentB.genes.slice(locus * 2, locus * 2 + 2).map((b, j) => (
                <div key={`${i}-${j}`}>
                  <span>
                    {names[a]} × {names[b]}
                  </span>
                  <strong>{names[Math.min(a, b)]}</strong>
                  <small>25% · 变异前</small>
                </div>
              )),
            )}
          </div>
          <p>
            每项有 12.5% 概率重抽其中一份基因。下列结果已计入变异
            {locus === 0 ? "与光谱显现判定" : ""}：
          </p>
          <ul className="probability-list">
            {distribution.map(
              (chance, index) =>
                chance > 0 && (
                  <li key={index}>
                    <span>{names[index]}</span>
                    <strong>
                      {formatProbability(chance * (locus === 0 ? spectrum.regular : 1))}
                    </strong>
                  </li>
                ),
            )}
          </ul>
        </>
      ) : (
        <p>
          光谱基因可以传承，但炫彩外观受独立稀有判定约束；实际显现概率见上方。双份炫彩基因也不保证炫彩外观。
        </p>
      )}
    </section>
  );
}
