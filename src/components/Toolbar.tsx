// src/components/Toolbar.tsx
// Top application toolbar.
// Open model, Save model, Load background map image, opacity slider.

import React from "react";

interface ToolbarProps {
  hasModel: boolean;
  isDirty: boolean;
  backgroundOpacity: number;
  backgroundImage: string | null;
  onOpen: () => void;
  onSave: () => void;
  onLoadImage: () => void;
  onOpacityChange: (opacity: number) => void;
}

export function Toolbar({
  hasModel,
  isDirty,
  backgroundOpacity,
  backgroundImage,
  onOpen,
  onSave,
  onLoadImage,
  onOpacityChange,
}: ToolbarProps) {
  return (
    <div
      style={{
        height: 44,
        backgroundColor: "#2c3e50",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 8,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {/* App title */}
      <span
        style={{
          color: "#ecf0f1",
          fontWeight: "bold",
          fontSize: 14,
          fontFamily: "sans-serif",
          marginRight: 12,
        }}
      >
        PyWR Canvas
      </span>

      {/* Open */}
      <ToolbarButton onClick={onOpen} title="Open Pywr model JSON">
        Open
      </ToolbarButton>

      {/* Save */}
      <ToolbarButton
        onClick={onSave}
        disabled={!hasModel}
        title="Save model to disk"
        highlight={isDirty}
      >
        {isDirty ? "Save *" : "Save"}
      </ToolbarButton>

      <Separator />

      {/* Load Map Image */}
      <ToolbarButton onClick={onLoadImage} disabled={!hasModel} title="Load background map image (PNG/JPG)">
        Load Map
      </ToolbarButton>

      {/* Opacity slider — only shown when a background image is loaded */}
      {backgroundImage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginLeft: 4,
          }}
        >
          <span style={{ color: "#bdc3c7", fontSize: 11, fontFamily: "sans-serif" }}>
            Opacity
          </span>
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={backgroundOpacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            style={{ width: 80, cursor: "pointer" }}
          />
          <span style={{ color: "#bdc3c7", fontSize: 11, fontFamily: "monospace", minWidth: 28 }}>
            {Math.round(backgroundOpacity * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  highlight?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, disabled, title, highlight, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        backgroundColor: highlight ? "#e67e22" : "#3d5166",
        color: disabled ? "#7f8c8d" : "#ecf0f1",
        border: "1px solid #506070",
        borderRadius: 4,
        padding: "4px 10px",
        fontSize: 12,
        fontFamily: "sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background-color 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Separator() {
  return (
    <div
      style={{
        width: 1,
        height: 24,
        backgroundColor: "#506070",
        margin: "0 4px",
      }}
    />
  );
}
