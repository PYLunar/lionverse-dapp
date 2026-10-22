/** Rarity measures expressed traits; a carrier does not receive the hidden trait's tier. */
export function rarityOf(lion) {
  if (lion.species >= 4 || lion.mane === 8 || lion.eyes === 6 || lion.crown === 3)
    return 3;
  if (
    lion.species === 3 ||
    lion.mane === 7 ||
    lion.pattern === 5 ||
    lion.crown === 2 ||
    lion.aura === 3
  )
    return 2;
  if (
    lion.species === 2 ||
    lion.mane === 6 ||
    lion.eyes === 5 ||
    lion.pattern >= 3 ||
    lion.crown === 1 ||
    lion.aura > 0 ||
    lion.temperament === 5
  )
    return 1;
  return 0;
}
