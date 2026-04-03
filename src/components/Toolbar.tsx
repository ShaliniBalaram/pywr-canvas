// src/components/Toolbar.tsx
// Top application toolbar.
// Open model, Save model, Load background map image, opacity slider.

import React from "react";

interface ToolbarProps {
  hasModel: boolean;
  isDirty: boolean;
  backgroundOpacity: number;
  backgroundImage: string | null;
  gridSize: number;
  gridSnap: boolean;
  gridLocked: boolean;
  onOpen: () => void;
  onSave: () => void;
  onLoadImage: () => void;
  onOpacityChange: (opacity: number) => void;
  onGridSizeChange: (size: number) => void;
  onGridSnapToggle: () => void;
  onGridLockToggle: () => void;
}

export function Toolbar({
  hasModel,
  isDirty,
  backgroundOpacity,
  backgroundImage,
  gridSize,
  gridSnap,
  gridLocked,
  onOpen,
  onSave,
  onLoadImage,
  onOpacityChange,
  onGridSizeChange,
  onGridSnapToggle,
  onGridLockToggle,
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
      <ToolbarButton onClick={onLoadImage} disabled={!hasModel} title="Load background map image (PNG/JPG) — then calibrate grid to trace network">
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

      <Separator />

      {/* Grid calibration controls */}
      <ToolbarButton
        onClick={onGridSnapToggle}
        disabled={!hasModel}
        title="Snap nodes to grid when dragging/placing — helps trace network from a background map"
        highlight={gridSnap}
      >
        {gridSnap ? "Snap ✓" : "Snap"}
      </ToolbarButton>

      {gridSnap && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#bdc3c7", fontSize: 11 }}>Grid</span>
          <input
            type="number"
            min={5}
            max={200}
            step={5}
            value={gridSize}
            disabled={gridLocked}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 5 && v <= 200) onGridSizeChange(v);
            }}
            title="Grid cell size in pixels"
            style={{
              width: 46,
              fontSize: 11,
              padding: "2px 4px",
              borderRadius: 3,
              border: "1px solid #506070",
              backgroundColor: gridLocked ? "#3a3a3a" : "#3d5166",
              color: gridLocked ? "#888" : "#ecf0f1",
              textAlign: "center",
              cursor: gridLocked ? "not-allowed" : "text",
            }}
          />
          <span style={{ color: "#bdc3c7", fontSize: 11 }}>px</span>
          <ToolbarButton
            onClick={onGridLockToggle}
            title={gridLocked ? "Unlock grid size" : "Lock grid size — prevents accidental changes after calibration"}
            highlight={gridLocked}
          >
            {gridLocked ? "🔒" : "🔓"}
          </ToolbarButton>
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
