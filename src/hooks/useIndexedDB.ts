import { useEffect, useState } from 'react';
import { getDB } from '../db/indexedDB';

/**
 * Boots the IndexedDB connection once for the tree and reports readiness plus
 * whether data will actually persist (useful for a "storage warning" banner).
 */
export function useIndexedDB() {
  const [state, setState] = useState<{ ready: boolean; persistent: boolean }>({
    ready: false,
    persistent: true,
  });

  useEffect(() => {
    let mounted = true;
    getDB().then((db) => {
      if (!mounted) return;
      setState({ ready: true, persistent: db !== null });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
