// src/components/Canvas.tsx
// React Flow canvas — renders Pywr nodes as draggable RF nodes, edges as RF edges.
// Background image rendered behind the canvas via absolutely positioned <img>.
// Drag-and-drop from NodePalette creates nodes at the drop position.

import React, { useCallback, useEffect, useRef } from "react";
import ReactFlow, {
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  Node as RFNode,
  Edge as RFEdge,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

import { PywrModel, PywrNode } from "../types/pywr";
import {
  NODE_COLOUR_MAP,
  NODE_SHAPE_MAP,
  NODE_DEFAULT_FIELDS,
} from "../constants/nodeTypes";
import { PywrNodeComponent } from "./PywrNode";

// Register the single custom node type used for all Pywr nodes
const nodeTypes: NodeTypes = { pywr: PywrNodeComponent };

interface CanvasProps {
  model: PywrModel | null;
  positions: Record<string, { x: number; y: number }>;
  backgroundImage: string | null;
  backgroundOpacity: number;
  selectedNodeName: string | null;
  highlightedNodeName: string | null;
  onNodeSelect: (name: string | null) => void;
  onNodeMove: (name: string, x: number, y: number) => void;
  onDeleteRequest: (name: string) => void;
  onAddNode: (nodeType: string, x: number, y: number) => void;
}

// Convert PywrModel to React Flow nodes
function toRFNodes(
  model: PywrModel,
  positions: Record<string, { x: number; y: number }>,
  selectedNodeName: string | null,
  highlightedNodeName: string | null
): RFNode[] {
  return model.nodes.map((node: PywrNode) => ({
    id: node.name,
    type: "pywr",
    position: positions[node.name] ?? { x: 0, y: 0 },
    data: {
      label: node.name,
      nodeType: node.type,
      colour: NODE_COLOUR_MAP[node.type] ?? "#888",
      shape: NODE_SHAPE_MAP[node.type] ?? { shape: "rectangle", border: "solid" },
      highlighted: node.name === highlightedNodeName,
    },
    selected: node.name === selectedNodeName,
  }));
}

// Convert PywrModel edges to React Flow edges
function toRFEdges(model: PywrModel): RFEdge[] {
  return model.edges.map((edge, i) => ({
    id: `${edge.from_node}->${edge.to_node}-${i}`,
    source: edge.from_node,
    target: edge.to_node,
    type: "smoothstep",
    style: { stroke: "#888", strokeWidth: 2 },
  }));
}

// Inner component — must be inside ReactFlowProvider to use useReactFlow
function CanvasInner({
  model,
  positions,
  backgroundImage,
  backgroundOpacity,
  selectedNodeName,
  highlightedNodeName,
  onNodeSelect,
  onNodeMove,
  onDeleteRequest,
  onAddNode,
}: CanvasProps) {
  const reactFlowInstance = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const rfNodes = model
    ? toRFNodes(model, positions, selectedNodeName, highlightedNodeName)
    : [];
  const rfEdges = model ? toRFEdges(model) : [];

  // Update position when user drags a node
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: RFNode) => {
      onNodeMove(node.id, node.position.x, node.position.y);
    },
    [onNodeMove]
  );

  // Click on node → select it; click on pane → deselect
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: RFNode) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  // Delete key → trigger delete dialog for selected node
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Delete" && selectedNodeName) {
        onDeleteRequest(selectedNodeName);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedNodeName, onDeleteRequest]);

  // Drag-and-drop from NodePalette
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData("application/pywr-node-type");
      if (!nodeType || !wrapperRef.current) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });
      onAddNode(nodeType, position.x, position.y);
    },
    [reactFlowInstance, onAddNode]
  );

  return (
    <div
      ref={wrapperRef}
      style={{ flex: 1, position: "relative", overflow: "hidden" }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {/* Background map image — rendered behind React Flow */}
      {backgroundImage && (
        <img
          src={`file://${backgroundImage}`}
          alt="background map"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: backgroundOpacity,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        deleteKeyCode={null}  // disable built-in delete — we show the dialog instead
        style={{ background: "transparent" }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background color="#e0e0e0" gap={20} />
        <Controls />
        <MiniMap zoomable pannable />
      </ReactFlow>
    </div>
  );
}

// Exported wrapper — provides ReactFlowProvider context
export function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
