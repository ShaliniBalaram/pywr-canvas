# python/pywr_schema.py
# Pywr node schema validation — derived from PYWR_SCHEMA.md
# Mirrors src/types/pywr.ts exactly

from dataclasses import dataclass, field
from typing import Any, Optional


# ---------------------------------------------------------------------------
# Validation result
# ---------------------------------------------------------------------------

@dataclass
class ValidationIssue:
    code: str           # e.g. "UNCONNECTED_NODE"
    severity: str       # "error" or "warning"
    message: str
    node_name: str = ""  # name of offending node, or "" if model-level


# ---------------------------------------------------------------------------
# Known node types (all lowercase — compared via .lower())
# ---------------------------------------------------------------------------

VALID_NODE_TYPES = {
    "input",
    "output",
    "link",
    "storage",
    "virtualstorage",
    "annualvirtualstorage",
    "piecewiselink",
    "aggregatednode",
    "aggregatedstorage",
    "river",
    "rivergauge",
    "catchment",
    "riversplithwithgauge",  # "RiverSplitWithGauge".lower()
}

# Required fields per node type (name and type always required — checked separately)
NODE_REQUIRED_FIELDS: dict[str, list[str]] = {
    "input":                [],
    "output":               [],
    "link":                 [],
    "storage":              ["max_volume"],
    "virtualstorage":       ["nodes"],
    "annualvirtualstorage": ["nodes", "max_volume"],
    "piecewiselink":        ["nsteps"],
    "aggregatednode":       ["nodes"],
    "aggregatedstorage":    ["storages"],
    "river":                [],
    "rivergauge":           [],
    "catchment":            [],
    "riversplithwithgauge": [],
}

# Node types that are "source" nodes (produce flow into the network)
SOURCE_TYPES = {"input", "catchment"}

# Node types that reference other nodes via fields rather than edges
# — exempt from UNCONNECTED_NODE warning
VIRTUAL_TYPES = {
    "aggregatednode",
    "aggregatedstorage",
    "virtualstorage",
    "annualvirtualstorage",
}


def _type_key(node_type: str) -> str:
    """Normalise node type string to lowercase for lookup."""
    return node_type.lower()


# ---------------------------------------------------------------------------
# Single-node validation
# ---------------------------------------------------------------------------

def validate_node(node: dict[str, Any]) -> list[ValidationIssue]:
    """Validate a single node dict. Returns a list of ValidationIssue."""
    issues: list[ValidationIssue] = []
    name = node.get("name")

    if not name or not isinstance(name, str) or not name.strip():
        issues.append(ValidationIssue(
            code="MISSING_REQUIRED_FIELD",
            severity="error",
            message="Node is missing a valid 'name' field",
            node_name="",
        ))
        name = "<unnamed>"

    node_type = node.get("type")
    if not node_type or not isinstance(node_type, str):
        issues.append(ValidationIssue(
            code="MISSING_REQUIRED_FIELD",
            severity="error",
            message=f"Node '{name}' is missing a valid 'type' field",
            node_name=name,
        ))
        return issues

    type_key = _type_key(node_type)
    if type_key not in VALID_NODE_TYPES:
        issues.append(ValidationIssue(
            code="INVALID_NODE_TYPE",
            severity="error",
            message=f"Node '{name}' has unknown type '{node_type}'",
            node_name=name,
        ))
        return issues

    required = NODE_REQUIRED_FIELDS.get(type_key, [])
    for req_field in required:
        if req_field not in node:
            issues.append(ValidationIssue(
                code="MISSING_REQUIRED_FIELD",
                severity="error",
                message=f"Node '{name}' (type '{node_type}') is missing required field '{req_field}'",
                node_name=name,
            ))

    return issues


# ---------------------------------------------------------------------------
# Edge validation
# ---------------------------------------------------------------------------

def validate_edges(
    edges: list[dict[str, Any]],
    node_names: set[str],
) -> list[ValidationIssue]:
    """Validate edge list against the set of known node names."""
    issues: list[ValidationIssue] = []
    for i, edge in enumerate(edges):
        from_node = edge.get("from_node")
        to_node = edge.get("to_node")

        if not from_node or not isinstance(from_node, str):
            issues.append(ValidationIssue(
                code="ORPHANED_EDGE",
                severity="error",
                message=f"Edge {i} is missing 'from_node'",
            ))
        elif from_node not in node_names:
            issues.append(ValidationIssue(
                code="ORPHANED_EDGE",
                severity="error",
                message=f"Edge {i} references unknown from_node '{from_node}'",
                node_name=from_node,
            ))

        if not to_node or not isinstance(to_node, str):
            issues.append(ValidationIssue(
                code="ORPHANED_EDGE",
                severity="error",
                message=f"Edge {i} is missing 'to_node'",
            ))
        elif to_node not in node_names:
            issues.append(ValidationIssue(
                code="ORPHANED_EDGE",
                severity="error",
                message=f"Edge {i} references unknown to_node '{to_node}'",
                node_name=to_node,
            ))

    return issues


# ---------------------------------------------------------------------------
# Full model validation
# ---------------------------------------------------------------------------

def validate_model(model_dict: dict[str, Any]) -> list[ValidationIssue]:
    """
    Validate a full Pywr model dict.
    Returns a list of ValidationIssue objects (never raises, never prints).
    """
    issues: list[ValidationIssue] = []

    if not isinstance(model_dict, dict):
        issues.append(ValidationIssue(
            code="MODEL_STRUCTURE_ERROR",
            severity="error",
            message="Model must be a JSON object",
        ))
        return issues

    nodes_raw = model_dict.get("nodes")
    edges_raw = model_dict.get("edges")
    timestepper = model_dict.get("timestepper")
    recorders_raw = model_dict.get("recorders", {})

    if nodes_raw is None:
        issues.append(ValidationIssue(
            code="MODEL_STRUCTURE_ERROR",
            severity="error",
            message="Model is missing 'nodes' array",
        ))
    elif not isinstance(nodes_raw, list):
        issues.append(ValidationIssue(
            code="MODEL_STRUCTURE_ERROR",
            severity="error",
            message="'nodes' must be an array",
        ))
        nodes_raw = []

    if edges_raw is None:
        issues.append(ValidationIssue(
            code="MODEL_STRUCTURE_ERROR",
            severity="warning",
            message="Model has no 'edges' array",
        ))
        edges_raw = []
    elif not isinstance(edges_raw, list):
        issues.append(ValidationIssue(
            code="MODEL_STRUCTURE_ERROR",
            severity="error",
            message="'edges' must be an array",
        ))
        edges_raw = []

    if timestepper is None:
        issues.append(ValidationIssue(
            code="MODEL_STRUCTURE_ERROR",
            severity="error",
            message="Model is missing 'timestepper'",
        ))
    elif not isinstance(timestepper, dict):
        issues.append(ValidationIssue(
            code="MODEL_STRUCTURE_ERROR",
            severity="error",
            message="'timestepper' must be an object",
        ))
    else:
        for ts_field in ("start", "end", "timestep"):
            if ts_field not in timestepper:
                issues.append(ValidationIssue(
                    code="MISSING_REQUIRED_FIELD",
                    severity="error",
                    message=f"'timestepper' is missing required field '{ts_field}'",
                ))

    if not isinstance(nodes_raw, list):
        return issues

    # Validate each node, collect names
    node_names: set[str] = set()
    node_types_by_name: dict[str, str] = {}
    for node in nodes_raw:
        node_issues = validate_node(node)
        issues.extend(node_issues)
        name = node.get("name")
        if name and isinstance(name, str):
            if name in node_names:
                issues.append(ValidationIssue(
                    code="DUPLICATE_NODE_NAME",
                    severity="error",
                    message=f"Duplicate node name '{name}'",
                    node_name=name,
                ))
            node_names.add(name)
            node_types_by_name[name] = node.get("type", "")

    # Validate edges
    edge_issues = validate_edges(edges_raw, node_names)
    issues.extend(edge_issues)

    # Identify connected nodes
    connected_nodes: set[str] = set()
    for edge in edges_raw:
        fn = edge.get("from_node")
        tn = edge.get("to_node")
        if fn and isinstance(fn, str):
            connected_nodes.add(fn)
        if tn and isinstance(tn, str):
            connected_nodes.add(tn)

    # Warn about unconnected nodes (skip virtual/aggregation types)
    for node in nodes_raw:
        name = node.get("name")
        node_type = node.get("type", "")
        if (
            name
            and isinstance(name, str)
            and _type_key(node_type) not in VIRTUAL_TYPES
            and name not in connected_nodes
        ):
            issues.append(ValidationIssue(
                code="UNCONNECTED_NODE",
                severity="warning",
                message=f"Node '{name}' is not connected to any edge",
                node_name=name,
            ))

    # Check for NO_RECORDER — any non-virtual node without a recorder referencing it
    recorders_by_node: set[str] = set()
    if isinstance(recorders_raw, dict):
        for rec_cfg in recorders_raw.values():
            if isinstance(rec_cfg, dict):
                ref = rec_cfg.get("node") or rec_cfg.get("param")
                if ref and isinstance(ref, str):
                    recorders_by_node.add(ref)
    elif isinstance(recorders_raw, list):
        for rec_cfg in recorders_raw:
            if isinstance(rec_cfg, dict):
                ref = rec_cfg.get("node") or rec_cfg.get("param")
                if ref and isinstance(ref, str):
                    recorders_by_node.add(ref)

    for node in nodes_raw:
        name = node.get("name")
        node_type = node.get("type", "")
        if (
            name
            and isinstance(name, str)
            and _type_key(node_type) not in VIRTUAL_TYPES
            and name not in recorders_by_node
        ):
            issues.append(ValidationIssue(
                code="NO_RECORDER",
                severity="warning",
                message=f"Node '{name}' has no recorder attached",
                node_name=name,
            ))

    # Check UNREACHABLE_DEMAND — Output node with no upstream path to Input/Catchment
    # Build reverse adjacency: for each node, list of its upstream neighbours
    reverse_adj: dict[str, list[str]] = {n: [] for n in node_names}
    for edge in edges_raw:
        fn = edge.get("from_node")
        tn = edge.get("to_node")
        if fn and tn and fn in node_names and tn in node_names:
            reverse_adj[tn].append(fn)

    for node in nodes_raw:
        name = node.get("name")
        node_type = node.get("type", "")
        if not name or _type_key(node_type) != "output":
            continue
        # BFS upstream from this Output node
        visited: set[str] = set()
        queue = [name]
        found_source = False
        while queue:
            current = queue.pop()
            if current in visited:
                continue
            visited.add(current)
            if _type_key(node_types_by_name.get(current, "")) in SOURCE_TYPES and current != name:
                found_source = True
                break
            queue.extend(reverse_adj.get(current, []))
        if not found_source:
            issues.append(ValidationIssue(
                code="UNREACHABLE_DEMAND",
                severity="warning",
                message=f"Output node '{name}' has no upstream path to any Input or Catchment",
                node_name=name,
            ))

    return issues
