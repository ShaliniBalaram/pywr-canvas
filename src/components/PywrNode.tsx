// src/components/PywrNode.tsx
// Custom React Flow node component — renders one Pywr node on the canvas.
// Shape and colour come from NODE_COLOUR_MAP and NODE_SHAPE_MAP in nodeTypes.ts.

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { NodeShape, NodeShapeType, NodeBorderStyle } from "../constants/nodeTypes";

interface PywrNodeData {
  label: string;
  nodeType: string;
  colour: string;
  shape: NodeShape;
  highlighted: boolean;
}

function getContainerStyle(
  shapeType: NodeShapeType,
  border: NodeBorderStyle,
  colour: string,
  selected: boolean,
  highlighted: boolean
): React.CSSProperties {
  const outline = highlighted
    ? "3px solid #FFD700"
    : selected
    ? "2px solid #1a73e8"
    : undefined;

  const base: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
    fontSize: "10px",
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    cursor: "pointer",
    userSelect: "none",
    outline,
    outlineOffset: "2px",
    transition: "outline 0.15s",
  };

  if (shapeType === "circle") {
    return {
      ...base,
      backgroundColor: colour,
      borderRadius: "50%",
      width: 80,
      height: 80,
      border:
        border === "dashed"
          ? `2px dashed ${darken(colour)}`
          : `2px solid ${darken(colour)}`,
    };
  }

  if (shapeType === "diamond") {
    return {
      ...base,
      backgroundColor: colour,
      width: 90,
      height: 90,
      clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
    };
  }

  if (shapeType === "hexagon") {
    return {
      ...base,
      backgroundColor: colour,
      width: 90,
      height: 80,
      clipPath:
        "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
    };
  }

  // rectangle
  const borderWidth = border === "thick" ? 3 : 2;
  const borderStyleStr = border === "dashed" ? "dashed" : "solid";
  return {
    ...base,
    backgroundColor: colour,
    borderRadius: 6,
    border: `${borderWidth}px ${borderStyleStr} ${darken(colour)}`,
    padding: "8px 12px",
    minWidth: 90,
    minHeight: 40,
  };
}

function darken(hex: string): string {
  // Slightly darken a hex colour for border
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - 40);
  const g = Math.max(0, ((n >> 8) & 0xff) - 40);
  const b = Math.max(0, (n & 0xff) - 40);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Handle style — small dots at connection points
const handleStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  background: "#555",
  border: "1px solid #fff",
};

export function PywrNodeComponent({ data, selected }: NodeProps<PywrNodeData>) {
  const { label, colour, shape, highlighted } = data;
  const containerStyle = getContainerStyle(
    shape.shape,
    shape.border,
    colour,
    selected ?? false,
    highlighted ?? false
  );

  return (
    <>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div style={containerStyle}>
        <span
          style={{
            maxWidth: 80,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            // For diamond/hexagon, clip-path clips the handles, so the label
            // must be visible inside the shape
            display: "block",
          }}
          title={label}
        >
          {label}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
    </>
  );
}
