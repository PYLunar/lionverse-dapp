import test from "node:test";
import assert from "node:assert/strict";
import { initialDemo, createDemoLion } from "../../src/domain/demo.js";
import {
  readDemo,
  saveDemo,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  validateCollection,
} from "../../src/services/demoStorage.js";
import { demoRepository, loadFamily, summarizeAlbum } from "../../src/domain/lineage.js";
import { LOCI } from "../../src/domain/genetics.js";

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) || null,
    setItem: (key, value) => map.set(key, value),
  };
}

test("legacy migration preserves IDs, visible traits, owners, dates, and original snapshot", () => {
  const old = initialDemo().map(({ genes, geneticsVersion, ...lion }) => lion);
  const raw = JSON.stringify(old),
    storage = memoryStorage({ [LEGACY_STORAGE_KEY]: raw });
  const migrated = readDemo(storage);
  assert.equal(storage.getItem(LEGACY_STORAGE_KEY), raw);
  assert(validateCollection(migrated));
  migrated.forEach((lion, index) => {
    for (const [key, value] of Object.entries(old[index])) assert.equal(lion[key], value);
    assert.equal(lion.geneticsOrigin, "legacy-homozygous");
  });
  assert.deepEqual(readDemo(storage), migrated);
});

test("a failed migration save still loads the old collection; explicit save reports failure", () => {
  const lions = initialDemo(),
    raw = JSON.stringify(lions.map(({ genes, geneticsVersion, ...lion }) => lion));
  const storage = {
    getItem: (key) => (key === LEGACY_STORAGE_KEY ? raw : null),
    setItem: () => {
      throw new Error("quota");
    },
  };
  assert.equal(readDemo(storage)[0].id, 1);
  assert.throws(() => saveDemo(lions, storage), /无法保存/);
});

test("corrupt genes, cycles and dangling parents do not overwrite saved data", () => {
  const lions = initialDemo();
  lions[0].genes[0] = 99;
  const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(lions) });
  assert(validateCollection(readDemo(storage)));
  assert.throws(() => saveDemo(lions, storage), /校验失败/);
  const broken = initialDemo();
  broken[0].parentA = 1;
  broken[0].parentB = 2;
  assert.equal(validateCollection(broken), false);
});

test("lineage survives transfers and traverses shared ancestors without false cycles", async () => {
  let lions = initialDemo();
  let birth = createDemoLion(lions, lions[0], lions[1], { seed: 1, now: 2000000000 });
  lions = birth.lions;
  birth = createDemoLion(lions, lions[0], birth.lion, { seed: 2, now: 2000000301 });
  lions = birth.lions;
  lions = lions.map((lion) =>
    lion.id === 1 ? { ...lion, owner: "another-wallet" } : lion,
  );
  const family = await loadFamily(8, demoRepository(lions));
  assert.equal(family.tree.parents[0].lion.owner, "another-wallet");
  assert.equal(family.tree.parents[1].parents[0].lion.id, 1);
  const ancestors = await loadFamily(1, demoRepository(lions));
  assert.deepEqual(
    ancestors.children.map((lion) => lion.id),
    [7, 8],
  );
  assert.equal(ancestors.tree.parents.length, 0);
});

test("family repository returns bounded children and surfaces unavailable records", async () => {
  const repository = demoRepository(initialDemo());
  assert.deepEqual(await repository.getChildren(1, 10, 6), { ids: [], total: 0 });
  await assert.rejects(loadFamily(99, repository), /未找到/);
});

test("album distinguishes visible and carried traits without counting other owners", () => {
  const lion = initialDemo()[1];
  const album = summarizeAlbum([lion], LOCI);
  assert.equal(album[0].entries[0].expressed, true);
  assert.equal(album[0].entries[3].expressed, false);
  assert.equal(album[0].entries[3].carried, true);
  assert.equal(album[3].entries[6].carried, true);
  assert.equal(album[3].entries[6].expressed, false);
});
