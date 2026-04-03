// src/hooks/usePywrJson.ts
// Manages the loaded Pywr model in React state.
// All API calls go through window.pywr.callApi — no direct fetch().

import { useState, useCallback } from "react";
import { PywrModel, PywrNode, PywrEdge } from "../types/pywr";

// window.pywr is exposed by electron/preload.js via contextBridge
declare global {
  interface Window {
    pywr: {
      openFile: () => Promise<string | null>;
      openImage: () => Promise<string | null>;
      saveFile: (defaultPath: string) => Promise<string | null>;
      callApi: (route: string, body: unknown) => Promise<unknown>;
      saveLayoutFile: (path: string, content: string) => Promise<void>;
      readLayoutFile: (path: string) => Promise<string | null>;
      openCsv: () => Promise<string | null>;
      readCsvColumns: (path: string) => Promise<string[]>;
    };
  }
}

interface UsePywrJsonReturn {
  model: PywrModel | null;
  currentPath: string | null;
  isLoading: boolean;
  error: string | null;
  openFile: () => Promise<void>;
  replaceModel: (model: PywrModel) => void;
  addNode: (node: PywrNode) => void;
  removeNode: (nodeName: string) => void;
  updateNode: (nodeName: string, updates: Partial<PywrNode>) => void;
  addEdge: (from: string, to: string) => void;
  removeEdge: (from: string, to: string) => void;
  addParameter: (name: string, def: unknown) => void;
  removeParameter: (name: string) => void;
  getNodeByName: (name: string) => PywrNode | undefined;
  getEdgesForNode: (name: string) => Array<[string, string]>;
  getOrphanedNodes: (removedName: string) => { upstream: string[]; downstream: string[] };
  isDirty: boolean;
  markSaved: () => void;
}

export function usePywrJson(): UsePywrJsonReturn {
  const [model, setModel] = useState<PywrModel | null>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // -------------------------------------------------------------------------
  // openFile — calls window.pywr.openFile() then POST /api/parse
  // -------------------------------------------------------------------------
  const openFile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const path = await window.pywr.openFile();
      if (!path) {
        // User cancelled the file picker
        return;
      }
      setCurrentPath(path);

      const response = await window.pywr.callApi("/api/parse", { json_path: path });
      const resp = response as { ok: boolean; data?: PywrModel; error?: string };

      if (!resp.ok) {
        setError(resp.error ?? "Failed to parse model");
        return;
      }

      setModel(resp.data ?? null);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error opening file");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // replaceModel — swap the entire model (used by JSON editor tab)
  // -------------------------------------------------------------------------
  const replaceModel = useCallback((newModel: PywrModel) => {
    setModel(newModel);
    setIsDirty(true);
  }, []);

  // -------------------------------------------------------------------------
  // addNode — immutable insert
  // -------------------------------------------------------------------------
  const addNode = useCallback((node: PywrNode) => {
    setModel((prev) => {
      if (!prev) return prev;
      return { ...prev, nodes: [...prev.nodes, node] };
    });
    setIsDirty(true);
  }, []);

  // -------------------------------------------------------------------------
  // removeNode — removes node by name; does NOT touch edges (caller's job)
  // -------------------------------------------------------------------------
  const removeNode = useCallback((nodeName: string) => {
    setModel((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        nodes: prev.nodes.filter((n) => n.name !== nodeName),
      };
    });
    setIsDirty(true);
  }, []);

  // -------------------------------------------------------------------------
  // updateNode — merges updates into the matching node
  // -------------------------------------------------------------------------
  const updateNode = useCallback((nodeName: string, updates: Partial<PywrNode>) => {
    setModel((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.name === nodeName ? ({ ...n, ...updates } as PywrNode) : n
        ),
      };
    });
    setIsDirty(true);
  }, []);

  // -------------------------------------------------------------------------
  // addEdge — immutable insert
  // -------------------------------------------------------------------------
  const addEdge = useCallback((from: string, to: string) => {
    setModel((prev) => {
      if (!prev) return prev;
      const edge: PywrEdge = { from_node: from, to_node: to };
      return { ...prev, edges: [...prev.edges, edge] };
    });
    setIsDirty(true);
  }, []);

  // -------------------------------------------------------------------------
  // removeEdge — removes the first edge matching from→to
  // -------------------------------------------------------------------------
  const removeEdge = useCallback((from: string, to: string) => {
    setModel((prev) => {
      if (!prev) return prev;
      let removed = false;
      const edges = prev.edges.filter((e) => {
        if (!removed && e.from_node === from && e.to_node === to) {
          removed = true;
          return false;
        }
        return true;
      });
      return { ...prev, edges };
    });
    setIsDirty(true);
  }, []);

  // -------------------------------------------------------------------------
  // addParameter / removeParameter — manage model.parameters entries
  // -------------------------------------------------------------------------
  const addParameter = useCallback((name: string, def: unknown) => {
    setModel((prev) => {
      if (!prev) return prev;
      return { ...prev, parameters: { ...prev.parameters, [name]: def } };
    });
    setIsDirty(true);
  }, []);

  const removeParameter = useCallback((name: string) => {
    setModel((prev) => {
      if (!prev) return prev;
      const { [name]: _removed, ...rest } = prev.parameters;
      return { ...prev, parameters: rest };
    });
    setIsDirty(true);
  }, []);

  // -------------------------------------------------------------------------
  // getNodeByName — pure query, no state mutation
  // -------------------------------------------------------------------------
  const getNodeByName = useCallback(
    (name: string): PywrNode | undefined => {
      return model?.nodes.find((n) => n.name === name);
    },
    [model]
  );

  // -------------------------------------------------------------------------
  // getEdgesForNode — returns all edges where node is from or to
  // -------------------------------------------------------------------------
  const getEdgesForNode = useCallback(
    (name: string): Array<[string, string]> => {
      if (!model) return [];
      return model.edges
        .filter((e) => e.from_node === name || e.to_node === name)
        .map((e) => [e.from_node, e.to_node]);
    },
    [model]
  );

  // -------------------------------------------------------------------------
  // getOrphanedNodes — pure query
  // Returns nodes that would become unreachable if removedName were deleted.
  // upstream:   nodes that only connect downstream through removedName
  // downstream: nodes that only connect upstream through removedName
  //
  // Definition used here:
  //   upstream   = nodes that have an edge TO removedName (they feed it)
  //   downstream = nodes that have an edge FROM removedName (it feeds them)
  // -------------------------------------------------------------------------
  const getOrphanedNodes = useCallback(
    (removedName: string): { upstream: string[]; downstream: string[] } => {
      if (!model) return { upstream: [], downstream: [] };

      const { nodes, edges } = model;

      // Nodes that feed into removedName
      const directUpstream = edges
        .filter((e) => e.to_node === removedName)
        .map((e) => e.from_node);

      // Nodes that removedName feeds into
      const directDownstream = edges
        .filter((e) => e.from_node === removedName)
        .map((e) => e.to_node);

      // Build edge map without removedName to check for alternative connections
      const remainingEdges = edges.filter(
        (e) => e.from_node !== removedName && e.to_node !== removedName
      );
      const remainingNodeNames = new Set(
        nodes.filter((n) => n.name !== removedName).map((n) => n.name)
      );

      // A node is "orphaned upstream" if after removing removedName it has no
      // outgoing edges at all (it was only feeding removedName)
      const orphanedUpstream = directUpstream.filter((upName) => {
        const hasOtherOutgoing = remainingEdges.some(
          (e) => e.from_node === upName && remainingNodeNames.has(e.to_node)
        );
        return !hasOtherOutgoing;
      });

      // A node is "orphaned downstream" if after removing removedName it has no
      // incoming edges at all (it was only being fed by removedName)
      const orphanedDownstream = directDownstream.filter((downName) => {
        const hasOtherIncoming = remainingEdges.some(
          (e) => e.to_node === downName && remainingNodeNames.has(e.from_node)
        );
        return !hasOtherIncoming;
      });

      return {
        upstream: orphanedUpstream,
        downstream: orphanedDownstream,
      };
    },
    [model]
  );

  // -------------------------------------------------------------------------
  // markSaved — resets isDirty (called by export flow)
  // -------------------------------------------------------------------------
  const markSaved = useCallback(() => {
    setIsDirty(false);
  }, []);

  return {
    model,
    currentPath,
    isLoading,
    error,
    openFile,
    replaceModel,
    addNode,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    addParameter,
    removeParameter,
    getNodeByName,
    getEdgesForNode,
    getOrphanedNodes,
    isDirty,
    markSaved,
  };
}
