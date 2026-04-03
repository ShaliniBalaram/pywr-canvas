// src/App.tsx — PyWR Canvas root component
// Wires together all hooks and components.

import React, { useState, useCallback } from "react";
import { usePywrJson } from "./hooks/usePywrJson";
import { useLayout } from "./hooks/useLayout";
import { Canvas } from "./components/Canvas";
import { NodePalette, createNodeFromDrop } from "./components/NodePalette";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { DeleteNodeDialog } from "./components/DeleteNodeDialog";
import { ValidationBar } from "./components/ValidationBar";
import { Toolbar } from "./components/Toolbar";
import { TabBar, AppTab } from "./components/TabBar";
import { JsonEditor } from "./components/JsonEditor";
import { PywrNode, PywrModel } from "./types/pywr";

export default function App() {
  const pywrJson = usePywrJson();
  const layout = useLayout();

  const [activeTab, setActiveTab] = useState<AppTab>("canvas");
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [highlightedNodeName, setHighlightedNodeName] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(20);
  const [gridSnap, setGridSnap] = useState(false);
  const [gridLocked, setGridLocked] = useState(false);

  const selectedNode = selectedNodeName
    ? pywrJson.getNodeByName(selectedNodeName)
    : undefined;

  // -----------------------------------------------------------------------
  // Open file: parse model then load layout sidecar
  // -----------------------------------------------------------------------
  const handleOpen = useCallback(async () => {
    await pywrJson.openFile();
    // After openFile, pywrJson.currentPath is set
    // Load layout for the new file (auto-layout if no sidecar exists)
    // We do this in an effect below via currentPath change
  }, [pywrJson]);

  // When currentPath changes (new file opened), load layout
  const prevPath = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (pywrJson.currentPath && pywrJson.currentPath !== prevPath.current) {
      prevPath.current = pywrJson.currentPath;
      layout.loadLayout(pywrJson.currentPath).then(() => {
        // If no positions were loaded (empty), run auto-layout
        if (pywrJson.model && Object.keys(layout.positions).length === 0) {
          layout.autoLayout(pywrJson.model.nodes.map((n) => n.name));
        }
      });
    }
  }, [pywrJson.currentPath, pywrJson.model, layout]);

  // -----------------------------------------------------------------------
  // Save: export model + write layout sidecar
  // -----------------------------------------------------------------------
  const handleSave = useCallback(async () => {
    if (!pywrJson.model) return;
    setSaveError(null);

    const defaultPath = pywrJson.currentPath ?? "model.json";
    const savePath = await window.pywr.saveFile(defaultPath);
    if (!savePath) return; // user cancelled

    const response = await window.pywr.callApi("/api/export", {
      model: pywrJson.model,
      output_path: savePath,
    });
    const resp = response as { ok: boolean; error?: string };
    if (!resp.ok) {
      setSaveError(resp.error ?? "Export failed");
      return;
    }

    // Write layout sidecar alongside the model file
    await layout.saveLayout(savePath);
    pywrJson.markSaved();
  }, [pywrJson, layout]);

  // -----------------------------------------------------------------------
  // Load background map image
  // -----------------------------------------------------------------------
  const handleLoadImage = useCallback(async () => {
    const imagePath = await window.pywr.openImage();
    if (imagePath) {
      layout.setBackgroundImage(imagePath);
    }
  }, [layout]);

  // -----------------------------------------------------------------------
  // Add node from palette drop
  // -----------------------------------------------------------------------
  const handleAddNode = useCallback(
    (nodeType: string, x: number, y: number) => {
      if (!pywrJson.model) return;
      const existingNames = new Set(pywrJson.model.nodes.map((n) => n.name));
      const { node, name } = createNodeFromDrop(nodeType, x, y, existingNames);
      pywrJson.addNode(node);
      layout.setPosition(name, x, y);
    },
    [pywrJson, layout]
  );

  // -----------------------------------------------------------------------
  // JSON editor tab — apply full model replacement
  // -----------------------------------------------------------------------
  const handleJsonApply = useCallback(
    (newModel: PywrModel) => {
      pywrJson.replaceModel(newModel);
    },
    [pywrJson]
  );

  // -----------------------------------------------------------------------
  // CSV parameter linking — creates a named CSVParameter in model.parameters
  // and sets the node field to the parameter name
  // -----------------------------------------------------------------------
  const handleLinkCsv = useCallback(
    (fieldKey: string, csvPath: string, column: string) => {
      if (!selectedNodeName) return;
      const paramName = `${selectedNodeName}__${fieldKey}`;
      pywrJson.addParameter(paramName, {
        type: "CSVParameter",
        url: csvPath,
        column: column,
        index_col: "Date",
      });
      pywrJson.updateNode(selectedNodeName, { [fieldKey]: paramName } as Partial<PywrNode>);
    },
    [pywrJson, selectedNodeName]
  );

  // -----------------------------------------------------------------------
  // Highlight a node from the validation bar for 2s
  // -----------------------------------------------------------------------
  const handleNodeHighlight = useCallback((name: string) => {
    setHighlightedNodeName(name);
    setTimeout(() => setHighlightedNodeName(null), 2000);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      {/* Top toolbar — always visible */}
      <Toolbar
        hasModel={!!pywrJson.model}
        isDirty={pywrJson.isDirty}
        backgroundOpacity={layout.backgroundOpacity}
        backgroundImage={layout.backgroundImage}
        gridSize={gridSize}
        gridSnap={gridSnap}
        gridLocked={gridLocked}
        onOpen={handleOpen}
        onSave={handleSave}
        onLoadImage={handleLoadImage}
        onOpacityChange={layout.setBackgroundOpacity}
        onGridSizeChange={setGridSize}
        onGridSnapToggle={() => setGridSnap((s) => !s)}
        onGridLockToggle={() => setGridLocked((l) => !l)}
      />

      {/* Tab bar */}
      <TabBar
        activeTab={activeTab}
        hasModel={!!pywrJson.model}
        onTabChange={setActiveTab}
      />

      {/* Main content — switches between tabs */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: "column" }}>

        {/* Canvas tab */}
        <div style={{ display: activeTab === "canvas" ? "flex" : "none", flex: 1, overflow: "hidden" }}>
          {/* Left: node palette */}
          <NodePalette
            model={pywrJson.model}
            addNode={pywrJson.addNode}
            setPosition={layout.setPosition}
          />

          {/* Centre: canvas */}
          <Canvas
            model={pywrJson.model}
            positions={layout.positions}
            backgroundImage={layout.backgroundImage}
            backgroundOpacity={layout.backgroundOpacity}
            selectedNodeName={selectedNodeName}
            highlightedNodeName={highlightedNodeName}
            gridSize={gridSize}
            gridSnap={gridSnap}
            onNodeSelect={setSelectedNodeName}
            onNodeMove={layout.setPosition}
            onDeleteRequest={setDeleteTarget}
            onAddNode={handleAddNode}
          />

          {/* Right: properties panel (only when a node is selected) */}
          {selectedNode && (
            <PropertiesPanel
              node={selectedNode}
              onUpdate={(updates) =>
                pywrJson.updateNode(selectedNode.name, updates)
              }
              onLinkCsv={handleLinkCsv}
            />
          )}
        </div>

        {/* JSON editor tab */}
        {activeTab === "json" && pywrJson.model && (
          <JsonEditor
            model={pywrJson.model}
            onApply={handleJsonApply}
          />
        )}

        {/* Validation bar — only on canvas tab */}
        {activeTab === "canvas" && (
          <ValidationBar
            model={pywrJson.model}
            onNodeHighlight={handleNodeHighlight}
          />
        )}
      </div>

      {/* Delete dialog (modal) */}
      {deleteTarget && pywrJson.model && (
        <DeleteNodeDialog
          nodeName={deleteTarget}
          model={pywrJson.model}
          getOrphanedNodes={pywrJson.getOrphanedNodes}
          removeNode={pywrJson.removeNode}
          removeEdge={pywrJson.removeEdge}
          addEdge={pywrJson.addEdge}
          onClose={() => {
            setDeleteTarget(null);
            setSelectedNodeName(null);
          }}
        />
      )}

      {/* Loading / error overlays */}
      {pywrJson.isLoading && (
        <div style={overlayStyle}>
          <span style={{ color: "#fff", fontSize: 14 }}>Loading model…</span>
        </div>
      )}

      {(pywrJson.error || saveError) && (
        <div
          style={{
            position: "fixed",
            bottom: 44,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#c0392b",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 6,
            fontSize: 12,
            zIndex: 500,
            maxWidth: 500,
            textAlign: "center",
          }}
          onClick={() => setSaveError(null)}
        >
          {pywrJson.error ?? saveError}
        </div>
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 900,
};
