import { useEffect, useState } from "react";
import { DEMO_OWNER, PAGE_SIZE } from "../domain/constants.js";
import { loadPage, friendlyError } from "../services/blockchain.js";

/** Read the complete current collection in bounded batches, not the gallery's first page. */
export default function useAlbum(mode, wallet, demo, retry) {
  const [state, setState] = useState({ lions: [], total: 0, loading: false, error: "" });
  useEffect(() => {
    let active = true;
    if (mode === "demo") {
      const lions = demo.filter((lion) => lion.owner === DEMO_OWNER);
      setState({ lions, total: lions.length, loading: false, error: "" });
      return;
    }
    setState({ lions: [], total: 0, loading: Boolean(wallet), error: "" });
    if (!wallet) return;
    async function read() {
      let lions = [],
        total = Infinity,
        snapshot;
      while (active && lions.length < total) {
        const page = await loadPage(wallet, lions.length, PAGE_SIZE, wallet, snapshot);
        snapshot = page.blockNumber;
        if (!active) return;
        total = page.total;
        lions = [...lions, ...page.lions];
        setState({ lions, total, loading: lions.length < total, error: "" });
        if (!page.lions.length) break;
      }
    }
    read().catch((error) => {
      if (active)
        setState((old) => ({ ...old, loading: false, error: friendlyError(error) }));
    });
    return () => {
      active = false;
    };
  }, [mode, wallet, demo, retry]);
  return state;
}
