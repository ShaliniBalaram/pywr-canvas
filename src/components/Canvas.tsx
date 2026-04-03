// src/components/Canvas.tsx
// React Flow canvas — renders Pywr nodes as draggable RF nodes, edges as RF edges.
// Background image rendered using useViewport so it pans and zooms with the canvas.
// Drag-and-drop from NodePalette creates nodes at the drop position.

import React, { useCallback, useEffect, useRef, useMemo } from "react";
import ReactFlow, {
  ReactFlowProvider,
  useReactFlow,
  useViewport,
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
  gridSize: number;
  gridSnap: boolean;
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

// Background image that follows the ReactFlow viewport (pans and zooms with nodes).
// Must be rendered inside ReactFlowProvider so useViewport() works.
function ViewportImage({
  src,
  opacity,
}: {
  src: string;
  opacity: number;
}) {
  const { x, y, zoom } = useViewport();
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        transformOrigin: "0 0",
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <img
        src={src}
        alt="background map"
        style={{
          display: "block",
          maxWidth: "none",
          opacity,
        }}
        // Let the image render at its natural size in flow-coordinate space.
        // Users calibrate the grid to match the image's real-world scale.
      />
    </div>
  );
}

// Inner component — must be inside ReactFlowProvider to use useReactFlow / useViewport
function CanvasInner({
  model,
  positions,
  backgroundImage,
  backgroundOpacity,
  selectedNodeName,
  highlightedNodeName,
  gridSize,
  gridSnap,
  onNodeSelect,
  onNodeMove,
  onDeleteRequest,
  onAddNode,
}: CanvasProps) {
  const reactFlowInstance = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const didFitView = useRef(false);

  // Memoize node and edge arrays — prevents ReactFlow from re-reconciling
  // every time a parent state change triggers a re-render.
  const rfNodes = useMemo(
    () =>
      model
        ? toRFNodes(model, positions, selectedNodeName, highlightedNodeName)
        : [],
    [model, positions, selectedNodeName, highlightedNodeName]
  );

  const rfEdges = useMemo(
    () => (model ? toRFEdges(model) : []),
    [model]
  );

  // Fit view once when the model first loads — not on every subsequent update.
  useEffect(() => {
    if (!model || didFitView.current) return;
    // Short delay so ReactFlow has rendered the nodes before fitting
    const timer = setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
      didFitView.current = true;
    }, 50);
    return () => clearTimeout(timer);
  }, [model, reactFlowInstance]);

  // Reset the fitView guard when a new file is opened
  useEffect(() => {
    didFitView.current = false;
  }, [model?.nodes.length === 0 ? null : model?.nodes[0]?.name]);

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
      // screenToFlowPosition replaces the deprecated project() in RF 11.10+
      const position = reactFlowInstance.screenToFlowPosition({
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
      {/* Background map — rendered with viewport transform so it pans and zooms
          in sync with the nodes. Placed before ReactFlow in DOM so it's behind. */}
      {backgroundImage && (
        <ViewportImage
          src={`file://${backgroundImage}`}
          opacity={backgroundOpacity}
        />
      )}

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        deleteKeyCode={null}       // we show a confirmation dialog instead
        snapToGrid={gridSnap}
        snapGrid={[gridSize, gridSize]}
        panOnDrag={true}           // drag on empty canvas to pan
        zoomOnScroll={true}        // scroll wheel to zoom
        zoomOnPinch={true}         // trackpad pinch to zoom
        panOnScroll={false}        // keep scroll as zoom, not pan
        minZoom={0.05}             // allow zooming far out to see full map
        maxZoom={8}                // allow zooming in to trace fine detail
        style={{ background: "transparent", position: "relative", zIndex: 1 }}
      >
        <Background color="#e0e0e0" gap={20} />
        <Controls showInteractive={false} />
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
