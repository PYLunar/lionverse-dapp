export const ANCESTOR_DEPTH = 2;
export const CHILD_PAGE_SIZE = 6;

/**
 * Load a bounded ancestry DAG; repeat ancestors share a cached read, not a fake cycle.
 * Providers supply direct-child pagination so transfers never sever family links.
 */
export async function loadFamily(rootId, repository, childOffset = 0) {
  const cache = new Map();
  const get = (id) => {
    if (!cache.has(id)) cache.set(id, repository.getLion(id));
    return cache.get(id);
  };
  async function ancestor(id, depth, path = new Set()) {
    if (path.has(id)) throw new Error("家谱数据存在循环，请检查数据来源。");
    const lion = await get(id);
    const nextPath = new Set([...path, id]);
    const parents =
      depth && lion.parentA
        ? await Promise.all(
            [lion.parentA, lion.parentB].map((parent) =>
              ancestor(parent, depth - 1, nextPath),
            ),
          )
        : [];
    return { lion, parents };
  }
  const [tree, descendants] = await Promise.all([
    ancestor(rootId, ANCESTOR_DEPTH),
    repository.getChildren(rootId, childOffset, CHILD_PAGE_SIZE),
  ]);
  return {
    tree,
    children: await Promise.all(descendants.ids.map(get)),
    childTotal: descendants.total,
    childOffset,
  };
}

export function demoRepository(lions) {
  const byId = new Map(lions.map((lion) => [lion.id, lion]));
  return {
    async getLion(id) {
      const lion = byId.get(Number(id));
      if (!lion) throw new Error(`未找到狮子 #${id}。`);
      return lion;
    },
    async getChildren(id, offset, limit) {
      const children = lions
        .filter((lion) => lion.parentA === id || lion.parentB === id)
        .sort((a, b) => a.id - b.id);
      return {
        ids: children.slice(offset, offset + limit).map((lion) => lion.id),
        total: children.length,
      };
    },
  };
}

/** Current collection only: carried alleles and visibly expressed traits are separate. */
export function summarizeAlbum(lions, loci) {
  return loci.map((locus, index) => ({
    ...locus,
    entries: locus.names.map((name, allele) => ({
      name,
      expressed: lions.some(
        (lion) =>
          (locus.key === "spectrum"
            ? Math.max(0, lion.species - 3)
            : locus.key === "species"
              ? lion.species < 4
                ? lion.species
                : -1
              : lion[locus.key]) === allele,
      ),
      carried: lions.some((lion) =>
        lion.genes.slice(index * 2, index * 2 + 2).includes(allele),
      ),
    })),
  }));
}
