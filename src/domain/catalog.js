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
export const SPECIES_STORIES = {
  4: {
    title: "逐光者",
    text: "狮屿的第一场雨停歇时，散落在海面的晨光沿着山谷升起。一只小狮子追着光奔跑，鬃毛染上了七种颜色。从此，普通炫彩狮总在雨后出发，把远方的色彩带回狮群。",
  },
  5: {
    title: "守夜者",
    text: "一次日蚀中，狮屿的海岸只剩黑与白。一只小狮子守在灯塔下，陪迷路的伙伴等到了黎明。它的鬃毛此后留下明暗交错的光泽。黑白炫彩狮因此被称作守夜者，记着归家的方向。",
  },
};
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
