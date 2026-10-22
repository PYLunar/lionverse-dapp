import { COOLDOWN, DEMO_OWNER, MAX_SUPPLY } from "./constants.js";
import { breedGenome, founderGenome, legacyGenome } from "./genetics.js";
import { rarityOf } from "./rarity.js";

/** Deliberate showcase fixtures, not a sample of the random birth distribution. */
export function initialDemo() {
  return Array.from({ length: 6 }, (_, i) => {
    const lion = {
      id: i + 1,
      species: [2, 0, 3, 0, 4, 1][i],
      fur: i,
      mane: [1, 0, 2, 3, 4, 5][i],
      eyes: [0, 2, 1, 2, 3, 4][i],
      pattern: [1, 0, 3, 2, 1, 0][i],
      temperament: [0, 1, 2, 4, 3, 0][i],
      aura: [1, 0, 2, 0, 3, 0][i],
      crown: [1, 0, 2, 0, 3, 0][i],
      generation: 0,
      bornAt: 1727481600 + i * 3600,
      parentA: 0,
      parentB: 0,
      dna: String(9876543210000 + i * 12877),
      nextBreedAt: 0,
      owner: i < 3 ? DEMO_OWNER : `0x${String(i).repeat(40)}`,
      geneticsVersion: 2,
    };
    lion.genes = legacyGenome(lion);
    // Two approachable starters carry diamond alleles for the breeding tutorial.
    if (i < 2) lion.genes[1] = 3;
    if (i === 1) lion.genes[7] = 6;
    lion.rarity = rarityOf(lion);
    return lion;
  });
}

/** Pure game transition. Clock and randomness are injected by the storage adapter. */
export function createDemoLion(lions, parentA, parentB, { seed, now }) {
  const id = Math.max(0, ...lions.map((lion) => lion.id)) + 1;
  if (id > MAX_SUPPLY) throw new Error("狮屿已经满员了。");
  if (Boolean(parentA) !== Boolean(parentB)) throw new Error("请选择两位亲代。");
  if (parentA) {
    // Resolve authoritative stored parents instead of trusting stale modal objects.
    parentA = lions.find((lion) => lion.id === parentA.id);
    parentB = lions.find((lion) => lion.id === parentB.id);
    if (!parentA || !parentB) throw new Error("亲代不存在。");
    if (parentA.id === parentB.id) throw new Error("请选择两只不同的狮子。");
    if ([parentA, parentB].some((lion) => lion.owner !== DEMO_OWNER))
      throw new Error("只能繁育自己的狮子。");
    if ([parentA, parentB].some((lion) => lion.nextBreedAt > now))
      throw new Error("狮子正在休息，请稍后再来。");
  }
  const inherited = parentA ? breedGenome(parentA, parentB, seed) : founderGenome(seed);
  const lion = {
    ...inherited,
    id,
    generation: parentA ? Math.max(parentA.generation, parentB.generation) + 1 : 0,
    parentA: parentA?.id || 0,
    parentB: parentB?.id || 0,
    bornAt: now,
    dna: BigInt(seed).toString(),
    nextBreedAt: now + COOLDOWN,
    owner: DEMO_OWNER,
    geneticsVersion: 2,
  };
  lion.rarity = rarityOf(lion);
  return {
    lion,
    lions: [
      ...lions.map((item) =>
        [parentA?.id, parentB?.id].includes(item.id)
          ? { ...item, nextBreedAt: now + COOLDOWN }
          : item,
      ),
      lion,
    ],
  };
}
