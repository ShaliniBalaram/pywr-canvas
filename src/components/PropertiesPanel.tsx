// src/components/PropertiesPanel.tsx
// Right sidebar — shows all fields of the selected node as editable form inputs.
// Field types come from PYWR_SCHEMA.md. name and type are always read-only.
// Changes are applied on blur (not on every keystroke). Invalid values show errors.

import React, { useState, useEffect } from "react";
import { PywrNode } from "../types/pywr";

interface FieldDef {
  key: string;
  label: string;
  inputType: "text" | "number" | "checkbox" | "json-array";
  readOnly?: boolean;
}

// Field definitions per node type — derived from PYWR_SCHEMA.md
const FIELD_DEFS: Record<string, FieldDef[]> = {
  Input: [
    { key: "name",     label: "Name",     inputType: "text",   readOnly: true },
    { key: "type",     label: "Type",     inputType: "text",   readOnly: true },
    { key: "max_flow", label: "Max Flow", inputType: "text" },
    { key: "min_flow", label: "Min Flow", inputType: "text" },
    { key: "cost",     label: "Cost",     inputType: "text" },
    { key: "comment",  label: "Comment",  inputType: "text" },
  ],
  Output: [
    { key: "name",     label: "Name",     inputType: "text",   readOnly: true },
    { key: "type",     label: "Type",     inputType: "text",   readOnly: true },
    { key: "max_flow", label: "Max Flow", inputType: "text" },
    { key: "min_flow", label: "Min Flow", inputType: "text" },
    { key: "cost",     label: "Cost",     inputType: "text" },
    { key: "comment",  label: "Comment",  inputType: "text" },
  ],
  Link: [
    { key: "name",     label: "Name",     inputType: "text",   readOnly: true },
    { key: "type",     label: "Type",     inputType: "text",   readOnly: true },
    { key: "max_flow", label: "Max Flow", inputType: "text" },
    { key: "min_flow", label: "Min Flow", inputType: "text" },
    { key: "cost",     label: "Cost",     inputType: "text" },
    { key: "comment",  label: "Comment",  inputType: "text" },
  ],
  Storage: [
    { key: "name",              label: "Name",              inputType: "text",       readOnly: true },
    { key: "type",              label: "Type",              inputType: "text",       readOnly: true },
    { key: "max_volume",        label: "Max Volume",        inputType: "number" },
    { key: "initial_volume",    label: "Initial Volume",    inputType: "number" },
    { key: "initial_volume_pc", label: "Initial Volume %",  inputType: "number" },
    { key: "min_volume",        label: "Min Volume",        inputType: "number" },
    { key: "cost",              label: "Cost",              inputType: "text" },
    { key: "level",             label: "Level",             inputType: "text" },
    { key: "area",              label: "Area",              inputType: "text" },
    { key: "num_inputs",        label: "Num Inputs",        inputType: "number" },
    { key: "num_outputs",       label: "Num Outputs",       inputType: "number" },
    { key: "comment",           label: "Comment",           inputType: "text" },
  ],
  VirtualStorage: [
    { key: "name",              label: "Name",              inputType: "text",       readOnly: true },
    { key: "type",              label: "Type",              inputType: "text",       readOnly: true },
    { key: "nodes",             label: "Nodes",             inputType: "json-array" },
    { key: "min_volume",        label: "Min Volume",        inputType: "number" },
    { key: "max_volume",        label: "Max Volume",        inputType: "number" },
    { key: "initial_volume",    label: "Initial Volume",    inputType: "number" },
    { key: "initial_volume_pc", label: "Initial Volume %",  inputType: "number" },
    { key: "cost",              label: "Cost",              inputType: "text" },
    { key: "factors",           label: "Factors",           inputType: "json-array" },
    { key: "comment",           label: "Comment",           inputType: "text" },
  ],
  AnnualVirtualStorage: [
    { key: "name",                    label: "Name",                  inputType: "text",       readOnly: true },
    { key: "type",                    label: "Type",                  inputType: "text",       readOnly: true },
    { key: "nodes",                   label: "Nodes",                 inputType: "json-array" },
    { key: "max_volume",              label: "Max Volume",            inputType: "number" },
    { key: "min_volume",              label: "Min Volume",            inputType: "number" },
    { key: "initial_volume",          label: "Initial Volume",        inputType: "number" },
    { key: "initial_volume_pc",       label: "Initial Volume %",      inputType: "number" },
    { key: "cost",                    label: "Cost",                  inputType: "text" },
    { key: "factors",                 label: "Factors",               inputType: "json-array" },
    { key: "reset_day",               label: "Reset Day",             inputType: "number" },
    { key: "reset_month",             label: "Reset Month",           inputType: "number" },
    { key: "reset_to_initial_volume", label: "Reset to Initial Vol.", inputType: "checkbox" },
    { key: "comment",                 label: "Comment",               inputType: "text" },
  ],
  PiecewiseLink: [
    { key: "name",      label: "Name",       inputType: "text",       readOnly: true },
    { key: "type",      label: "Type",       inputType: "text",       readOnly: true },
    { key: "nsteps",    label: "Num Steps",  inputType: "number" },
    { key: "costs",     label: "Costs",      inputType: "json-array" },
    { key: "max_flows", label: "Max Flows",  inputType: "json-array" },
    { key: "comment",   label: "Comment",    inputType: "text" },
  ],
  AggregatedNode: [
    { key: "name",     label: "Name",     inputType: "text",       readOnly: true },
    { key: "type",     label: "Type",     inputType: "text",       readOnly: true },
    { key: "nodes",    label: "Nodes",    inputType: "json-array" },
    { key: "min_flow", label: "Min Flow", inputType: "text" },
    { key: "max_flow", label: "Max Flow", inputType: "text" },
    { key: "cost",     label: "Cost",     inputType: "text" },
    { key: "comment",  label: "Comment",  inputType: "text" },
  ],
  AggregatedStorage: [
    { key: "name",     label: "Name",     inputType: "text",       readOnly: true },
    { key: "type",     label: "Type",     inputType: "text",       readOnly: true },
    { key: "storages", label: "Storages", inputType: "json-array" },
    { key: "comment",  label: "Comment",  inputType: "text" },
  ],
  River: [
    { key: "name",     label: "Name",     inputType: "text", readOnly: true },
    { key: "type",     label: "Type",     inputType: "text", readOnly: true },
    { key: "max_flow", label: "Max Flow", inputType: "text" },
    { key: "min_flow", label: "Min Flow", inputType: "text" },
    { key: "cost",     label: "Cost",     inputType: "text" },
    { key: "comment",  label: "Comment",  inputType: "text" },
  ],
  RiverGauge: [
    { key: "name",     label: "Name",     inputType: "text",   readOnly: true },
    { key: "type",     label: "Type",     inputType: "text",   readOnly: true },
    { key: "mrf",      label: "MRF",      inputType: "number" },
    { key: "cost",     label: "Cost",     inputType: "number" },
    { key: "mrf_cost", label: "MRF Cost", inputType: "number" },
    { key: "comment",  label: "Comment",  inputType: "text" },
  ],
  Catchment: [
    { key: "name",    label: "Name",    inputType: "text", readOnly: true },
    { key: "type",    label: "Type",    inputType: "text", readOnly: true },
    { key: "flow",    label: "Flow",    inputType: "text" },
    { key: "cost",    label: "Cost",    inputType: "text" },
    { key: "comment", label: "Comment", inputType: "text" },
  ],
  RiverSplitWithGauge: [
    { key: "name",       label: "Name",       inputType: "text",       readOnly: true },
    { key: "type",       label: "Type",       inputType: "text",       readOnly: true },
    { key: "mrf",        label: "MRF",        inputType: "number" },
    { key: "cost",       label: "Cost",       inputType: "number" },
    { key: "mrf_cost",   label: "MRF Cost",   inputType: "number" },
    { key: "factors",    label: "Factors",    inputType: "json-array" },  // SCHEMA_GAP
    { key: "slot_names", label: "Slot Names", inputType: "json-array" }, // SCHEMA_GAP
    { key: "comment",    label: "Comment",    inputType: "text" },
  ],
};

interface PropertiesPanelProps {
  node: PywrNode;
  onUpdate: (updates: Partial<PywrNode>) => void;
}

interface FieldRowProps {
  fieldDef: FieldDef;
  value: unknown;
  onCommit: (key: string, value: unknown) => void;
}

function FieldRow({ fieldDef, value, onCommit }: FieldRowProps) {
  const [localValue, setLocalValue] = useState<string>(
    fieldDef.inputType === "json-array"
      ? JSON.stringify(value ?? [])
      : String(value ?? "")
  );
  const [error, setError] = useState<string | null>(null);

  // Sync when external value changes (e.g. undo)
  useEffect(() => {
    setLocalValue(
      fieldDef.inputType === "json-array"
        ? JSON.stringify(value ?? [])
        : String(value ?? "")
    );
    setError(null);
  }, [value, fieldDef.inputType]);

  function handleBlur() {
    if (fieldDef.readOnly) return;
    const trimmed = localValue.trim();

    if (fieldDef.inputType === "number") {
      if (trimmed === "") {
        // Empty — clear the field
        onCommit(fieldDef.key, undefined);
        setError(null);
        return;
      }
      const n = Number(trimmed);
      if (isNaN(n)) {
        setError("Must be a number");
        return;
      }
      setError(null);
      onCommit(fieldDef.key, n);
      return;
    }

    if (fieldDef.inputType === "json-array") {
      try {
        const parsed = JSON.parse(trimmed || "[]");
        if (!Array.isArray(parsed)) {
          setError("Must be a JSON array");
          return;
        }
        setError(null);
        onCommit(fieldDef.key, parsed);
      } catch {
        setError("Invalid JSON array");
      }
      return;
    }

    // text — allow parameter name strings or plain text
    setError(null);
    onCommit(fieldDef.key, trimmed === "" ? undefined : trimmed);
  }

  if (fieldDef.inputType === "checkbox") {
    return (
      <div style={rowStyle}>
        <label style={labelStyle}>{fieldDef.label}</label>
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={fieldDef.readOnly}
          onChange={(e) => {
            if (!fieldDef.readOnly) onCommit(fieldDef.key, e.target.checked);
          }}
          style={{ marginTop: 2 }}
        />
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <label style={labelStyle}>{fieldDef.label}</label>
      <div style={{ flex: 1 }}>
        <input
          type="text"
          value={localValue}
          readOnly={fieldDef.readOnly}
          disabled={fieldDef.readOnly}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "3px 6px",
            border: error ? "1px solid #c0392b" : "1px solid #ccc",
            borderRadius: 3,
            fontSize: 11,
            backgroundColor: fieldDef.readOnly ? "#f0f0f0" : "#fff",
            color: fieldDef.readOnly ? "#777" : "#222",
          }}
        />
        {error && (
          <div style={{ color: "#c0392b", fontSize: 10, marginTop: 2 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: 6,
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  width: 90,
  minWidth: 90,
  fontSize: 10,
  color: "#555",
  paddingTop: 4,
  fontWeight: "bold",
  textAlign: "right",
};

export function PropertiesPanel({ node, onUpdate }: PropertiesPanelProps) {
  const fields = FIELD_DEFS[node.type] ?? [
    { key: "name", label: "Name", inputType: "text" as const, readOnly: true },
    { key: "type", label: "Type", inputType: "text" as const, readOnly: true },
  ];

  function handleCommit(key: string, value: unknown) {
    if (key === "name" || key === "type") return; // always read-only
    onUpdate({ [key]: value } as Partial<PywrNode>);
  }

  return (
    <div
      style={{
        width: 240,
        minWidth: 240,
        backgroundColor: "#fafafa",
        borderLeft: "1px solid #ddd",
        overflowY: "auto",
        padding: "12px 10px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: "bold",
          color: "#333",
          marginBottom: 10,
          borderBottom: "1px solid #ddd",
          paddingBottom: 6,
        }}
      >
        Properties
        <span
          style={{
            fontSize: 10,
            color: "#888",
            fontWeight: "normal",
            marginLeft: 6,
          }}
        >
          {node.type}
        </span>
      </div>

      {fields.map((fd) => (
        <FieldRow
          key={fd.key}
          fieldDef={fd}
          value={(node as unknown as Record<string, unknown>)[fd.key]}
          onCommit={handleCommit}
        />
      ))}
    </div>
  );
}
