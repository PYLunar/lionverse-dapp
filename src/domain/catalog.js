export const SPECIES = [
  "Savanna Lion",
  "Snow Lion",
  "Golden Lion",
  "Diamond Lion",
  "Rainbow Lion",
  "Monochrome Lion",
];
export const FURS = [
  "Sunlit Gold",
  "Cream White",
  "Misty Blue",
  "Terracotta",
  "Twilight Purple",
  "Obsidian Gray",
];
export const MANES = ["Chestnut", "Sunburst", "Horned"];
export const EYES = ["Olive Green", "Glacier Blue", "Amber", "Amethyst"];
export const SPECIES_STORIES = {
  4: {
    title: "The Light Chaser",
    text: "When the first rain over Lion Isle ended, morning light rose from the sea and spilled into the valleys. A young lion chased it, and seven colors settled into its mane. Ever since, Rainbow Lions have set out after the rain, bringing the colors of distant places home to their pride.",
  },
  5: {
    title: "The Night Keeper",
    text: "During a solar eclipse, the coast of Lion Isle faded to black and white. A young lion waited beneath the lighthouse, keeping lost companions safe until dawn. Light and shadow have shimmered through its mane ever since. Known as the Night Keepers, Monochrome Lions always remember the way home.",
  },
};
export const shortAddress = (address) =>
  address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
export const rarityOf = (lion) =>
  lion.species >= 4
    ? "Legendary"
    : lion.species === 3
      ? "Epic"
      : lion.species === 2
        ? "Rare"
        : "Common";
export const traitLabels = (lion) => [
  ["Species", SPECIES[lion.species]],
  ["Fur", FURS[lion.fur]],
  ["Mane", MANES[lion.mane]],
  ["Eyes", EYES[lion.eyes]],
];
