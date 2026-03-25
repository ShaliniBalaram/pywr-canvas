# python/server.py — PyWR Canvas Flask backend
# Runs on localhost:47821 (hardcoded — see ARCHITECTURE.md and CLAUDE.md)

import json
import logging
import os
import sys

from flask import Flask, request, jsonify
from flask_cors import CORS

from pywr_schema import validate_model
from add_recorders import add_recorders as _add_recorders

FLASK_PORT = 47821

app = Flask(__name__)
# CORS for Electron renderer in dev mode (localhost:3000)
CORS(app, origins=["http://localhost:3000"])

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)


def _ok(data):
    return jsonify({"ok": True, "data": data})


def _err(message):
    return jsonify({"ok": False, "error": message})


def _issue_to_dict(issue):
    return {
        "code": issue.code,
        "severity": issue.severity,
        "message": issue.message,
        "node_name": issue.node_name,
    }


# ---------------------------------------------------------------------------
# POST /api/parse
# Body:   { "json_path": "/absolute/path/to/model.json" }
# Return: { "ok": true, "data": { "nodes": [], "edges": [],
#           "parameters": {}, "recorders": {}, "timestepper": {} } }
# ---------------------------------------------------------------------------
@app.route("/api/parse", methods=["POST"])
def parse():
    body = request.get_json(silent=True)
    if body is None:
        return _err("Request body must be JSON")

    json_path = body.get("json_path")
    if not json_path or not str(json_path).strip():
        return _err("json_path is required")

    json_path = str(json_path).strip()

    if not os.path.isabs(json_path):
        return _err("Path must be absolute")

    if not os.path.exists(json_path):
        return _err(f"File not found: {json_path}")

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            raw = f.read()
    except OSError as e:
        return _err(f"Could not read file: {e}")

    try:
        model = json.loads(raw)
    except json.JSONDecodeError as e:
        return _err(f"Invalid JSON: {e}")

    if not isinstance(model, dict):
        return _err("Model file must be a JSON object")

    nodes = model.get("nodes", [])
    edges = model.get("edges", [])
    node_count = len(nodes) if isinstance(nodes, list) else 0
    edge_count = len(edges) if isinstance(edges, list) else 0
    log.info("Parsed: %s — %d nodes, %d edges", json_path, node_count, edge_count)

    return _ok({
        "nodes":       nodes if isinstance(nodes, list) else [],
        "edges":       edges if isinstance(edges, list) else [],
        "parameters":  model.get("parameters", {}),
        "recorders":   model.get("recorders", {}),
        "timestepper": model.get("timestepper", {}),
        "metadata":    model.get("metadata", {}),
    })


# ---------------------------------------------------------------------------
# POST /api/validate
# Body:   { "model": { ...full pywr model object... } }
# Return: { "ok": true, "data": { "warnings": [], "errors": [] } }
# ---------------------------------------------------------------------------
@app.route("/api/validate", methods=["POST"])
def validate():
    body = request.get_json(silent=True)
    if body is None:
        return _err("Request body must be JSON")

    model = body.get("model")
    if model is None:
        return _err("model is required")
    if not isinstance(model, dict):
        return _err("model must be a JSON object")

    issues = validate_model(model)

    warnings = [_issue_to_dict(i) for i in issues if i.severity == "warning"]
    errors   = [_issue_to_dict(i) for i in issues if i.severity == "error"]

    return _ok({"warnings": warnings, "errors": errors})


# ---------------------------------------------------------------------------
# POST /api/add-recorders
# Body:   { "model": { ...full pywr model object... } }
# Return: { "ok": true, "data": { "model": {...}, "added": [] } }
# ---------------------------------------------------------------------------
@app.route("/api/add-recorders", methods=["POST"])
def add_recorders_route():
    body = request.get_json(silent=True)
    if body is None:
        return _err("Request body must be JSON")

    model = body.get("model")
    if model is None:
        return _err("model is required")
    if not isinstance(model, dict):
        return _err("model must be a JSON object")

    updated_model, added = _add_recorders(model)

    return _ok({
        "model": updated_model,
        "added": added,
    })


# ---------------------------------------------------------------------------
# POST /api/export
# Body:   { "model": {...}, "output_path": "/absolute/path/to/output.json" }
# Return: { "ok": true, "data": { "written_to": "/absolute/path/..." } }
# ---------------------------------------------------------------------------
@app.route("/api/export", methods=["POST"])
def export():
    body = request.get_json(silent=True)
    if body is None:
        return _err("Request body must be JSON")

    model = body.get("model")
    if model is None:
        return _err("model is required")
    if not isinstance(model, dict):
        return _err("model must be a JSON object")

    output_path = body.get("output_path")
    if not output_path or not str(output_path).strip():
        return _err("output_path is required")

    output_path = str(output_path).strip()

    if not os.path.isabs(output_path):
        return _err("output_path must be absolute")

    # Validate before writing — block on errors (not warnings)
    issues = validate_model(model)
    errors = [i for i in issues if i.severity == "error"]
    if errors:
        error_count = len(errors)
        return _err(f"Model has {error_count} error(s) — fix before exporting")

    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(model, f, indent=2)
    except OSError as e:
        return _err(f"Could not write file: {e}")

    nodes = model.get("nodes", [])
    edges = model.get("edges", [])
    node_count = len(nodes) if isinstance(nodes, list) else 0
    edge_count = len(edges) if isinstance(edges, list) else 0
    log.info("Exported: %s — %d nodes, %d edges", output_path, node_count, edge_count)

    return _ok({"written_to": output_path})


if __name__ == "__main__":
    print(f"PyWR Canvas backend started on port {FLASK_PORT}")
    app.run(host="127.0.0.1", port=FLASK_PORT, debug=False)
