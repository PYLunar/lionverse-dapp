import { Sprout, PawPrint, Dna, ShieldCheck, BookOpen } from "lucide-react";
import LionPortrait from "../LionPortrait.jsx";
import Badge from "../components/Badge.jsx";
import {
  SPECIES,
  FURS,
  MANES,
  EYES,
  PATTERNS,
  TEMPERAMENTS,
  AURAS,
  CROWNS,
  WEIGHTS,
  RARITIES,
} from "../domain/catalog.js";
import { initialDemo } from "../domain/demo.js";

export default function GuidePage() {
  return (
    <section className="guide-section">
      <div className="guide-lead">
        <Sprout size={35} />
        <h2>一只狮子，一个独一无二的身份。</h2>
        <p>
          狮屿的每位居民都是 ERC-721
          数字藏品。它们拥有唯一编号、不可修改的基因和可查证的归属；外观可能相似，身份永远独立。
        </p>
      </div>
      <div className="guide-cards">
        {[
          [
            PawPrint,
            "01 / 相遇",
            "随机领养",
            "免费铸造一只 Gen 0 狮子，随机获得品种、毛色、鬃毛、瞳色、花纹、性格、光效和冠饰。链上操作只需测试 ETH 支付 Gas。",
          ],
          [
            Dna,
            "02 / 延续",
            "基因繁育",
            "双亲须属于同一钱包。幼崽代数是双亲较高代数加一，每项特征从双亲各取一份等位基因，有 1/8 概率重抽其中一份。隐性基因配对后可显现；炫彩另作低概率判定。",
          ],
          [
            ShieldCheck,
            "03 / 珍藏",
            "真正属于你",
            "特征、双亲、出生时间和元数据均保存在链上。你可以在详情中查看归属，并通过钱包签名将 NFT 转赠。",
          ],
        ].map(([Icon, tag, title, text]) => (
          <article key={title}>
            <Icon size={25} />
            <span>{tag}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="species-guide">
        <h3>六大品种 · 不止是颜色</h3>
        <div>
          {SPECIES.map((species, i) => (
            <article key={species.name} className={`species-sample palette-${i}`}>
              <LionPortrait
                lion={{
                  ...initialDemo()[i],
                  species: i,
                  crown: 0,
                  aura: i === 4 ? 3 : 0,
                }}
              />
              <strong>
                {species.name}
                <span>{species.probability}</span>
              </strong>
              <p>{species.description}</p>
            </article>
          ))}
        </div>
        <p className="pagination-note">
          初代品种理论概率；稀有特征可独立组合，例如黄金狮也可能拥有星芒瞳与悬浮光环。
        </p>
      </div>
      <section className="genetics-guide">
        <h3>隐性遗传与炫彩稀缺</h3>
        <p>
          普通特征每项有两份等位基因，图鉴中较靠前的款式优先显现。例如两只携带钻石隐性基因的原野狮，在不计变异与炫彩判定时，有
          25% 机会配出钻石基础品种。
        </p>
        <p>
          光谱倾向单独控制炫彩潜力，双份基因也不保证显现。无光谱倾向的普通双亲，炫彩总概率为
          0.1%；一位／两位携带者为 0.5%／1%；一位／两位已显现炫彩的亲代为 3%／6%。
        </p>
        <p>
          初代普通炫彩为 1.49%，黑白炫彩为
          0.01%。繁育中黑白炫彩是炫彩结果中的极稀有分支：普通炫彩双亲仅约 0.006%
          产生黑白炫彩（双亲均无黑白倾向时）；黑白双亲最高也只有
          0.06%。配对预览展示具体组合的最终概率。
        </p>
        <p>
          家谱图鉴展示父母、祖辈及直系子代。个人图鉴区分已显现、仅携带和未收录，基于当前自有藏品计算。
        </p>
      </section>
      <div className="trait-guide">
        <h3>天生不同的基因图鉴</h3>
        {[
          ["毛色", FURS.map((x) => x.name)],
          ["鬃毛", MANES.map((x, i) => `${x.name} · ${WEIGHTS.mane[i]}%`)],
          ["瞳色", EYES.map((x, i) => `${x.name} · ${WEIGHTS.eyes[i]}%`)],
          ["花纹", PATTERNS.map((x, i) => `${x} · ${WEIGHTS.pattern[i]}%`)],
          ["性格", TEMPERAMENTS.map((x, i) => `${x} · ${WEIGHTS.temperament[i]}%`)],
          ["光效", AURAS.map((x, i) => `${x} · ${WEIGHTS.aura[i]}%`)],
          ["冠饰", CROWNS.map((x, i) => `${x} · ${WEIGHTS.crown[i]}%`)],
        ].map(([label, values]) => (
          <div className="trait-row" key={label}>
            <strong>{label}</strong>
            <div>
              {values.map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
          </div>
        ))}
        <p>
          6 品种 × 6 毛色 × 9 鬃毛 × 7 瞳色 × 6 花纹 × 6 性格 × 4 光效 × 4 冠饰 =
          1,306,368 种特征组合。品种有独特身体结构，部分外观会覆盖基础毛色或鬃毛形态。
        </p>
      </div>
      <div className="rarity-guide">
        <h3>每一次相遇，都是惊喜</h3>
        <div>
          {RARITIES.map((r, i) => (
            <article key={r.name}>
              <Badge rarity={i} />
              <small>{r.rule}</small>
            </article>
          ))}
        </div>
        <p>
          稀有度取已显现特征中的最高等级，隐性携带不会提高外观稀有度。图鉴中的概率用于初代生成与变异重抽；后代概率受双亲基因影响，不保证稀有双亲产生稀有幼崽。当前为教学测试网游戏，采用可预测、可被影响的伪随机数，不适用于真实价值抽奖。
        </p>
      </div>
      <div className="guide-bottom">
        <BookOpen size={20} />
        <p>
          参考 Project Tutorial 的 React → Ethers → Solidity → Sepolia
          架构。完整启动、部署和合约说明见独立项目中的 README.md。
        </p>
      </div>
    </section>
  );
}
