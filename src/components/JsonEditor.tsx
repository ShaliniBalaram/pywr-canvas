// src/components/JsonEditor.tsx
// Raw JSON editor for the full PyWR model.
// Lets users edit parameters, recorders, tables, timestepper, and metadata directly.
// Changes are only applied to the canvas model when the user clicks "Apply".

import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { PywrModel } from "../types/pywr";

interface JsonEditorProps {
  model: PywrModel;
  onApply: (model: PywrModel) => void;
}

export function JsonEditor({ model, onApply }: JsonEditorProps) {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(model, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // When the canvas model changes (e.g. user edits a node on canvas while on
  // the JSON tab), refresh the editor — but only if the user hasn't made
  // unsaved edits here, to avoid clobbering their work.
  const modelRef = useRef(model);
  useEffect(() => {
    if (!isDirty) {
      setJsonText(JSON.stringify(model, null, 2));
    }
    modelRef.current = model;
  }, [model, isDirty]);

  function handleChange(value: string | undefined) {
    const text = value ?? "";
    setJsonText(text);
    setIsDirty(true);

    // Live parse check — show error inline but don't block typing
    try {
      JSON.parse(text);
      setParseError(null);
    } catch (e) {
      setParseError((e as Error).message);
    }
  }

  function handleApply() {
    try {
      const parsed = JSON.parse(jsonText) as PywrModel;
      setParseError(null);
      setIsDirty(false);
      onApply(parsed);
    } catch (e) {
      setParseError((e as Error).message);
    }
  }

  function handleDiscard() {
    setJsonText(JSON.stringify(modelRef.current, null, 2));
    setParseError(null);
    setIsDirty(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 12px",
          backgroundColor: "#f0f0f0",
          borderBottom: "1px solid #ddd",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, color: "#555", fontFamily: "sans-serif", flex: 1 }}>
          Edit the full model JSON — parameters, recorders, tables, timestepper, metadata.
          {isDirty && (
            <span style={{ color: "#e67e22", marginLeft: 8, fontWeight: "bold" }}>
              Unsaved changes
            </span>
          )}
        </span>

        {isDirty && (
          <button
            onClick={handleDiscard}
            style={btnStyle(false)}
            title="Discard edits and revert to canvas model"
          >
            Discard
          </button>
        )}

        <button
          onClick={handleApply}
          disabled={!!parseError}
          style={btnStyle(!parseError)}
          title="Apply JSON changes to the canvas"
        >
          Apply Changes
        </button>
      </div>

      {/* Error bar */}
      {parseError && (
        <div
          style={{
            padding: "4px 12px",
            backgroundColor: "#fdecea",
            borderBottom: "1px solid #f5c6c2",
            color: "#c0392b",
            fontSize: 11,
            fontFamily: "monospace",
            flexShrink: 0,
          }}
        >
          JSON error: {parseError}
        </div>
      )}

      {/* Monaco editor */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Editor
          language="json"
          value={jsonText}
          onChange={handleChange}
          theme="vs"
          options={{
            minimap: { enabled: true },
            fontSize: 12,
            lineNumbers: "on",
            wordWrap: "off",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: true,
          }}
        />
      </div>
    </div>
  );
}

function btnStyle(enabled: boolean): React.CSSProperties {
  return {
    padding: "4px 12px",
    fontSize: 11,
    fontFamily: "sans-serif",
    fontWeight: "bold",
    backgroundColor: enabled ? "#2980b9" : "#bdc3c7",
    color: enabled ? "#fff" : "#888",
    border: "none",
    borderRadius: 4,
    cursor: enabled ? "pointer" : "not-allowed",
  };
}
