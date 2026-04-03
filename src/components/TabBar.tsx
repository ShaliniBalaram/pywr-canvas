// src/components/TabBar.tsx
// Tab switcher between Canvas, JSON editor, and (future) Run view.

import React from "react";

export type AppTab = "canvas" | "json" | "run";

interface TabBarProps {
  activeTab: AppTab;
  hasModel: boolean;
  onTabChange: (tab: AppTab) => void;
}

export function TabBar({ activeTab, hasModel, onTabChange }: TabBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        backgroundColor: "#233140",
        paddingLeft: 12,
        gap: 2,
        flexShrink: 0,
        borderBottom: "1px solid #1a252f",
      }}
    >
      <Tab
        label="Canvas"
        tab="canvas"
        active={activeTab === "canvas"}
        disabled={false}
        onClick={onTabChange}
      />
      <Tab
        label="JSON"
        tab="json"
        active={activeTab === "json"}
        disabled={!hasModel}
        title={hasModel ? "Edit raw model JSON — parameters, recorders, tables" : "Open a model first"}
        onClick={onTabChange}
      />
      <Tab
        label="Run  (coming soon)"
        tab="run"
        active={false}
        disabled={true}
        title="Run the PyWR solver — coming in a future version"
        onClick={onTabChange}
      />
    </div>
  );
}

interface TabProps {
  label: string;
  tab: AppTab;
  active: boolean;
  disabled: boolean;
  title?: string;
  onClick: (tab: AppTab) => void;
}

function Tab({ label, tab, active, disabled, title, onClick }: TabProps) {
  return (
    <button
      onClick={() => !disabled && onClick(tab)}
      title={title}
      style={{
        padding: "6px 16px",
        fontSize: 12,
        fontFamily: "sans-serif",
        fontWeight: active ? "bold" : "normal",
        color: active ? "#ecf0f1" : disabled ? "#4a5a6a" : "#95a5a6",
        backgroundColor: active ? "#fafafa" : "transparent",
        border: "none",
        borderTop: active ? "2px solid #3B8BD4" : "2px solid transparent",
        borderRadius: "4px 4px 0 0",
        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none",
        transition: "color 0.15s, background-color 0.15s",
      }}
    >
      {label}
    </button>
  );
}
