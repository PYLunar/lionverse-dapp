import { useEffect, useState } from "react";
import { friendlyError } from "../services/blockchain.js";
import { loadFamily } from "../domain/lineage.js";

/** Scope each request to its selected root; late responses must not replace a new tree. */
export default function useFamily(rootId, repository, childOffset, retry) {
  const [state, setState] = useState({ data: null, loading: false, error: "" });
  useEffect(() => {
    let active = true;
    if (!rootId) {
      setState({ data: null, loading: false, error: "" });
      return;
    }
    setState({ data: null, loading: true, error: "" });
    loadFamily(rootId, repository, childOffset)
      .then((data) => {
        if (active) setState({ data, loading: false, error: "" });
      })
      .catch((error) => {
        if (active) setState({ data: null, loading: false, error: friendlyError(error) });
      });
    return () => {
      active = false;
    };
  }, [rootId, repository, childOffset, retry]);
  return state;
}
