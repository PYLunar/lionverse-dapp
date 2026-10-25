export const SPECIES = [
  "原野狮",
  "雪域狮",
  "黄金狮",
  "钻石狮",
  "普通炫彩狮",
  "黑白炫彩狮",
];
export const FURS = ["日光金", "奶油白", "雾霭蓝", "赤陶棕", "暮光紫", "曜石灰"];
export const MANES = ["栗色鬃", "太阳鬃", "尖角鬃"];
export const EYES = ["橄榄绿", "冰川蓝", "琥珀金", "紫水晶"];
export const shortAddress = (address) =>
  address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
export const rarityOf = (lion) =>
  lion.species >= 4
    ? "传说"
    : lion.species === 3
      ? "史诗"
      : lion.species === 2
        ? "稀有"
        : "普通";
export const traitLabels = (lion) => [
  ["品种", SPECIES[lion.species]],
  ["毛色", FURS[lion.fur]],
  ["鬃毛", MANES[lion.mane]],
  ["眼睛", EYES[lion.eyes]],
];
