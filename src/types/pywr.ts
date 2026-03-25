// src/types/pywr.ts
// TypeScript interfaces for Pywr model types
// All types derived from PYWR_SCHEMA.md

// A field value that can be either a numeric literal or a parameter reference string
export type FlowValue = number | string;

// ---------- Node interfaces ----------

export interface InputNode {
  name: string;
  type: "Input";
  max_flow?: FlowValue;
  min_flow?: FlowValue;
  cost?: FlowValue;
  comment?: string;
}

export interface OutputNode {
  name: string;
  type: "Output";
  max_flow?: FlowValue;
  min_flow?: FlowValue;
  cost?: FlowValue;
  comment?: string;
}

export interface LinkNode {
  name: string;
  type: "Link";
  max_flow?: FlowValue;
  min_flow?: FlowValue;
  cost?: FlowValue;
  comment?: string;
}

export interface StorageNode {
  name: string;
  type: "Storage";
  max_volume: FlowValue;
  initial_volume?: number;
  initial_volume_pc?: number;
  min_volume?: FlowValue;
  cost?: FlowValue;
  level?: FlowValue;
  area?: FlowValue;
  num_inputs?: number;
  num_outputs?: number;
  comment?: string;
}

export interface VirtualStorageNode {
  name: string;
  type: "VirtualStorage";
  nodes: string[];
  min_volume?: number;
  max_volume?: number;
  initial_volume?: number;
  initial_volume_pc?: number;
  cost?: FlowValue;
  factors?: number[];
  comment?: string;
}

export interface AnnualVirtualStorageNode {
  name: string;
  type: "AnnualVirtualStorage";
  nodes: string[];
  max_volume: number;
  min_volume?: number;
  initial_volume?: number;
  initial_volume_pc?: number;
  cost?: FlowValue;
  factors?: number[];
  reset_day?: number;
  reset_month?: number;
  reset_to_initial_volume?: boolean;
  comment?: string;
}

export interface PiecewiseLinkNode {
  name: string;
  type: "PiecewiseLink";
  nsteps: number;
  costs?: number[];
  max_flows?: FlowValue[];
  comment?: string;
}

export interface AggregatedNode {
  name: string;
  type: "AggregatedNode";
  nodes: string[];
  min_flow?: FlowValue;
  max_flow?: FlowValue;
  cost?: FlowValue;
  comment?: string;
}

export interface AggregatedStorageNode {
  name: string;
  type: "AggregatedStorage";
  storages: string[];
  comment?: string;
}

export interface RiverNode {
  name: string;
  type: "River";
  max_flow?: FlowValue;
  min_flow?: FlowValue;
  cost?: FlowValue;
  comment?: string;
}

export interface RiverGaugeNode {
  name: string;
  type: "RiverGauge";
  mrf?: FlowValue;
  cost?: number;
  mrf_cost?: number;
  comment?: string;
}

export interface CatchmentNode {
  name: string;
  type: "Catchment";
  flow?: FlowValue;
  cost?: FlowValue;
  comment?: string;
}

export interface RiverSplitWithGaugeNode {
  name: string;
  type: "RiverSplitWithGauge";
  mrf?: number;
  cost?: number;
  mrf_cost?: number;
  // SCHEMA_GAP: factors field — likely inherited from RiverSplit, unverified
  factors?: number[];
  // SCHEMA_GAP: slot_names field — likely inherited from RiverSplit, unverified
  slot_names?: string[];
  comment?: string;
}

// Union of all node types
export type PywrNode =
  | InputNode
  | OutputNode
  | LinkNode
  | StorageNode
  | VirtualStorageNode
  | AnnualVirtualStorageNode
  | PiecewiseLinkNode
  | AggregatedNode
  | AggregatedStorageNode
  | RiverNode
  | RiverGaugeNode
  | CatchmentNode
  | RiverSplitWithGaugeNode;

// ---------- Edge interface ----------

export interface PywrEdge {
  from_node: string;
  to_node: string;
  from_slot?: number;
  to_slot?: number;
}

// ---------- Timestepper ----------

export interface PywrTimestepper {
  start: string;
  end: string;
  timestep: number;
}

// ---------- Metadata ----------

export interface PywrMetadata {
  title?: string;
  description?: string;
  minimum_version?: string;
}

// ---------- Recorder interfaces ----------

export interface NumpyArrayNodeRecorder {
  name: string;
  type: "NumpyArrayNodeRecorder";
  node: string;
  temporal_agg_func?: string;
  factor?: number;
  is_objective?: string;
  ignore_nan?: boolean;
  comment?: string;
}

export interface NumpyArrayNodeDeficitRecorder {
  name: string;
  type: "NumpyArrayNodeDeficitRecorder";
  node: string;
  temporal_agg_func?: string;
  is_objective?: string;
  ignore_nan?: boolean;
  comment?: string;
}

export interface NumpyArrayStorageRecorder {
  name: string;
  type: "NumpyArrayStorageRecorder";
  node: string;
  proportional?: boolean;
  temporal_agg_func?: string;
  is_objective?: string;
  ignore_nan?: boolean;
  comment?: string;
}

export interface NumpyArrayNormalisedStorageRecorder {
  name: string;
  type: "NumpyArrayNormalisedStorageRecorder";
  node: string;
  temporal_agg_func?: string;
  is_objective?: string;
  ignore_nan?: boolean;
  comment?: string;
}

export interface NumpyArrayParameterRecorder {
  name: string;
  type: "NumpyArrayParameterRecorder";
  param: string;
  temporal_agg_func?: string;
  is_objective?: string;
  ignore_nan?: boolean;
  comment?: string;
}

export type PywrRecorder =
  | NumpyArrayNodeRecorder
  | NumpyArrayNodeDeficitRecorder
  | NumpyArrayStorageRecorder
  | NumpyArrayNormalisedStorageRecorder
  | NumpyArrayParameterRecorder;

// ---------- Top-level model ----------

export interface PywrModel {
  nodes: PywrNode[];
  edges: PywrEdge[];
  parameters: Record<string, unknown>;
  recorders: Record<string, unknown>;
  timestepper: PywrTimestepper;
  metadata?: PywrMetadata;
}
