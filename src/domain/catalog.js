import spec from "../../shared/genetics.json" with { type: "json" };
import { DEMO_OWNER } from "./constants.js";

const namesOf = (key) => spec.loci.find((locus) => locus.key === key).names;
const withNames = (key, styles) =>
  styles.map((style, index) => ({ ...style, name: namesOf(key)[index] }));

export function formatProbability(value) {
  return `${Number((value * 100).toFixed(4))}%`;
}

const founderSpectrum = spec.spectrum.founderPrismatic / spec.spectrum.denominator;
const baseSpeciesWeight = spec.loci[0].weights.reduce((sum, weight) => sum + weight, 0);
const baseProbability = (index) =>
  formatProbability(
    (spec.loci[0].weights[index] / baseSpeciesWeight) * (1 - founderSpectrum),
  );

export const SPECIES = [
  {
    name: namesOf("species")[0],
    probability: baseProbability(0),
    description: "柔软皮毛与圆润的自然体态",
  },
  {
    name: namesOf("species")[1],
    probability: baseProbability(1),
    description: "绒白胸毛与双层耳绒",
  },
  {
    name: namesOf("species")[2],
    probability: baseProbability(2),
    description: "金属质感、日轮额饰与浮雕胸甲",
  },
  {
    name: namesOf("species")[3],
    probability: baseProbability(3),
    description: "晶体角冠、棱面鬃毛与钻石胸核",
  },
  {
    name: `${namesOf("spectrum")[1]}狮`,
    probability: formatProbability(
      (spec.spectrum.founderPrismatic - spec.spectrum.founderMonochrome) /
        spec.spectrum.denominator,
    ),
    description: "虹彩鬃毛、极光飘带与悬浮棱晶",
  },
  {
    name: `${namesOf("spectrum")[2]}狮`,
    probability: formatProbability(
      spec.spectrum.founderMonochrome / spec.spectrum.denominator,
    ),
    description: "黑白虹光、日蚀光环与黑曜棱晶",
  },
];
export const AURAS = namesOf("aura");
export const CROWNS = namesOf("crown");
export const WEIGHTS = Object.fromEntries(
  spec.loci.map((locus) => [locus.key, locus.weights]),
);
export const FURS = withNames("fur", [
  { color: "#E6B86A", light: "#F7DDA3" },
  { color: "#F3DEB3", light: "#FFF1D5" },
  { color: "#A9BEC9", light: "#DCE5E8" },
  { color: "#BC8563", light: "#E0B895" },
  { color: "#C8B8DC", light: "#EBE1F2" },
  { color: "#596574", light: "#99A4AE" },
]);
export const MANES = withNames("mane", [
  { color: "#9A5D32", shape: "fluffy" },
  { color: "#C78D47", shape: "sun" },
  { color: "#657F88", shape: "cloud" },
  { color: "#663E35", shape: "wild" },
  { color: "#87719E", shape: "fluffy" },
  { color: "#363B4B", shape: "wild" },
  { color: "#D86B3D", shape: "flame" },
  { color: "#82C9D9", shape: "crystal" },
  { color: "#6F60B3", shape: "orbital" },
]);
export const EYES = withNames("eyes", [
  { color: "#729A67" },
  { color: "#72A9C5" },
  { color: "#D49B39" },
  { color: "#9674B3" },
  { color: "#91BBAF" },
  { color: "#E6B750" },
  { color: "#BC97ED" },
]);
export const PATTERNS = namesOf("pattern");
export const TEMPERAMENTS = namesOf("temperament");
export const RARITIES = [
  { name: "普通", en: "COMMON", className: "common", rule: "自然基础特征" },
  { name: "稀有", en: "RARE", className: "rare", rule: "黄金品种或稀有特征" },
  { name: "史诗", en: "EPIC", className: "epic", rule: "钻石品种或史诗特征" },
  {
    name: "传说",
    en: "LEGENDARY",
    className: "legendary",
    rule: "炫彩、星环鬃、星芒瞳或光环",
  },
];
const NAMES = [
  "日冕",
  "奶糖",
  "蓝调",
  "栗子",
  "月桂",
  "夜航",
  "麦芽",
  "云朵",
  "晚星",
  "松露",
  "琥珀",
  "小满",
];
const EN_NAMES = [
  "Sol",
  "Mochi",
  "Nimbus",
  "Cedar",
  "Luna",
  "Onyx",
  "Milo",
  "Cloud",
  "Nova",
  "Truffle",
  "Amber",
  "Sunny",
];
export const lionName = (lion) => NAMES[(lion.id - 1) % NAMES.length];
export const lionEnglish = (lion) => EN_NAMES[(lion.id - 1) % EN_NAMES.length];
export const shortAddress = (address) =>
  address === DEMO_OWNER
    ? "我的演示钱包"
    : address
      ? `${address.slice(0, 6)}…${address.slice(-4)}`
      : "未连接";
export const tokenNumber = (id) => `#${String(id).padStart(4, "0")}`;
export function traits(lion) {
  return [
    ["品种", SPECIES[lion.species].name],
    ["毛色", FURS[lion.fur].name],
    ["鬃毛", MANES[lion.mane].name],
    ["瞳色", EYES[lion.eyes].name],
    ["花纹", PATTERNS[lion.pattern]],
    ["性格", TEMPERAMENTS[lion.temperament]],
    ["光效", AURAS[lion.aura]],
    ["冠饰", CROWNS[lion.crown]],
    ["代数", `Gen ${lion.generation}`],
  ];
}
