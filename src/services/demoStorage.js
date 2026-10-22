import { initialDemo } from "../domain/demo.js";
import { expressGenes, isGenome, legacyGenome, spectrumOf } from "../domain/genetics.js";
import { rarityOf } from "../domain/rarity.js";
import { MAX_SUPPLY } from "../domain/constants.js";

export const STORAGE_KEY = "lionverse-demo-v3";
export const LEGACY_STORAGE_KEY = "lionverse-demo-v2";

function validLion(lion, legacy) {
  if (
    !lion ||
    !Number.isSafeInteger(lion.id) ||
    lion.id < 1 ||
    lion.id > MAX_SUPPLY ||
    typeof lion.owner !== "string" ||
    !/^\d+$/.test(lion.dna)
  )
    return false;
  if (
    !["generation", "bornAt", "nextBreedAt", "parentA", "parentB"].every(
      (key) => Number.isSafeInteger(lion[key]) && lion[key] >= 0,
    )
  )
    return false;
  const limits = {
    species: legacy ? 5 : 6,
    fur: 6,
    mane: 9,
    eyes: 7,
    pattern: 6,
    temperament: 6,
    aura: 4,
    crown: 4,
    rarity: 4,
  };
  if (
    Object.entries(limits).some(
      ([key, limit]) =>
        !Number.isInteger(lion[key]) || lion[key] < 0 || lion[key] >= limit,
    )
  )
    return false;
  if (legacy) return true;
  if (lion.geneticsVersion !== 2 || !isGenome(lion.genes)) return false;
  const expressed = expressGenes(lion.genes, spectrumOf(lion));
  return (
    Object.entries(expressed).every(([key, value]) => lion[key] === value) &&
    rarityOf(lion) === lion.rarity
  );
}

/** Reject broken parent references and cycles before exposing browser data to the UI. */
export function validateCollection(lions, legacy = false) {
  if (
    !Array.isArray(lions) ||
    !lions.length ||
    lions.length > MAX_SUPPLY ||
    lions.some((lion) => !validLion(lion, legacy))
  )
    return false;
  const byId = new Map(lions.map((lion) => [lion.id, lion]));
  if (byId.size !== lions.length) return false;
  return lions.every((lion) => {
    if (!lion.parentA && !lion.parentB) return lion.generation === 0;
    const a = byId.get(lion.parentA),
      b = byId.get(lion.parentB);
    return (
      a &&
      b &&
      a.id !== b.id &&
      a.id < lion.id &&
      b.id < lion.id &&
      lion.generation === Math.max(a.generation, b.generation) + 1
    );
  });
}

/** Migration never invents historical ancestry or deletes the previous storage key. */
export function readDemo(storage = globalThis.localStorage) {
  try {
    const current = storage.getItem(STORAGE_KEY);
    if (current) {
      const lions = JSON.parse(current);
      return validateCollection(lions) ? lions : initialDemo();
    }
    const legacy = JSON.parse(storage.getItem(LEGACY_STORAGE_KEY) || "null");
    if (!validateCollection(legacy, true)) return initialDemo();
    const migrated = legacy.map((lion) => ({
      ...lion,
      genes: legacyGenome(lion),
      geneticsVersion: 2,
      geneticsOrigin: "legacy-homozygous",
    }));
    // A full disk must not prevent reading the user's original collection.
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    } catch {
      /* Retry on the next explicit save. */
    }
    return migrated;
  } catch {
    return initialDemo();
  }
}

export function saveDemo(lions, storage = globalThis.localStorage) {
  if (!validateCollection(lions)) throw new Error("演示收藏校验失败，未覆盖原数据。");
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(lions));
  } catch {
    throw new Error("浏览器无法保存演示收藏，请允许本站使用本地存储后重试。");
  }
}

export function randomSeed() {
  const words = crypto.getRandomValues(new Uint32Array(8));
  return BigInt(
    `0x${[...words].map((word) => word.toString(16).padStart(8, "0")).join("")}`,
  );
}
