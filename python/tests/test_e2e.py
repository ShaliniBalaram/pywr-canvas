# python/tests/test_e2e.py
# End-to-end tests for PyWR Canvas Flask API.
# Exercises all four routes against the minimal_model.json fixture.
# Run: pytest python/tests/test_e2e.py -v

import json
import os
import tempfile

import pytest

# Make sure python/ is on the path so we can import server.py
PYTHON_DIR = os.path.join(os.path.dirname(__file__), "..")
import sys
sys.path.insert(0, PYTHON_DIR)

from server import app


FIXTURE_PATH = os.path.join(
    os.path.dirname(__file__), "fixtures", "minimal_model.json"
)


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


@pytest.fixture
def minimal_model():
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Fixture sanity
# ---------------------------------------------------------------------------

def test_fixture_is_valid_json():
    """The fixture file must be parseable by json.load."""
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, dict)
    assert "nodes" in data
    assert "edges" in data
    assert "timestepper" in data


def test_fixture_has_expected_structure(minimal_model):
    assert len(minimal_model["nodes"]) == 3
    assert len(minimal_model["edges"]) == 2


# ---------------------------------------------------------------------------
# POST /api/parse
# ---------------------------------------------------------------------------

def test_parse_requires_json_path(client):
    resp = client.post("/api/parse", json={})
    data = resp.get_json()
    assert data["ok"] is False
    assert "json_path is required" in data["error"]


def test_parse_rejects_relative_path(client):
    resp = client.post("/api/parse", json={"json_path": "relative/path.json"})
    data = resp.get_json()
    assert data["ok"] is False
    assert "absolute" in data["error"].lower()


def test_parse_rejects_nonexistent_path(client):
    resp = client.post("/api/parse", json={"json_path": "/nonexistent/model.json"})
    data = resp.get_json()
    assert data["ok"] is False
    assert "not found" in data["error"].lower()


def test_parse_valid_fixture(client):
    resp = client.post("/api/parse", json={"json_path": FIXTURE_PATH})
    data = resp.get_json()
    assert data["ok"] is True
    assert len(data["data"]["nodes"]) == 3
    assert len(data["data"]["edges"]) == 2
    assert "timestepper" in data["data"]


# ---------------------------------------------------------------------------
# POST /api/validate
# ---------------------------------------------------------------------------

def test_validate_requires_model(client):
    resp = client.post("/api/validate", json={})
    data = resp.get_json()
    assert data["ok"] is False
    assert "model is required" in data["error"]


def test_validate_clean_model_returns_no_errors(client, minimal_model):
    resp = client.post("/api/validate", json={"model": minimal_model})
    data = resp.get_json()
    assert data["ok"] is True
    # Clean model should have 0 errors
    assert len(data["data"]["errors"]) == 0


def test_validate_detects_unconnected_node(client, minimal_model):
    # Add a node with no edges
    minimal_model["nodes"].append({"name": "Orphan_Node", "type": "Input"})
    resp = client.post("/api/validate", json={"model": minimal_model})
    data = resp.get_json()
    assert data["ok"] is True
    codes = [w["code"] for w in data["data"]["warnings"]]
    assert "UNCONNECTED_NODE" in codes


def test_validate_detects_duplicate_name(client, minimal_model):
    minimal_model["nodes"].append({"name": "Bordon_GW", "type": "Output"})
    resp = client.post("/api/validate", json={"model": minimal_model})
    data = resp.get_json()
    assert data["ok"] is True
    codes = [e["code"] for e in data["data"]["errors"]]
    assert "DUPLICATE_NODE_NAME" in codes


def test_validate_detects_orphaned_edge(client, minimal_model):
    minimal_model["edges"].append({
        "from_node": "Nonexistent_Node",
        "to_node": "Bordon_DC",
    })
    resp = client.post("/api/validate", json={"model": minimal_model})
    data = resp.get_json()
    assert data["ok"] is True
    codes = [e["code"] for e in data["data"]["errors"]]
    assert "ORPHANED_EDGE" in codes


# ---------------------------------------------------------------------------
# POST /api/add-recorders
# ---------------------------------------------------------------------------

def test_add_recorders_requires_model(client):
    resp = client.post("/api/add-recorders", json={})
    data = resp.get_json()
    assert data["ok"] is False


def test_add_recorders_adds_to_all_nodes(client, minimal_model):
    resp = client.post("/api/add-recorders", json={"model": minimal_model})
    data = resp.get_json()
    assert data["ok"] is True
    # Fixture has 3 nodes and no recorders, so 3 should be added.
    # Bordon_DC ends in _DC so it also gets a deficit recorder → 4 total.
    added = data["data"]["added"]
    assert len(added) == 4  # 3 NumpyArrayNodeRecorder + 1 NumpyArrayNodeDeficitRecorder

    recorder_types = [a["recorder_type"] for a in added]
    assert "NumpyArrayNodeRecorder" in recorder_types
    assert "NumpyArrayNodeDeficitRecorder" in recorder_types


def test_add_recorders_skips_existing(client, minimal_model):
    # Pre-add a recorder for Bordon_GW
    minimal_model["recorders"]["Bordon_GW_recorder"] = {
        "type": "NumpyArrayNodeRecorder",
        "node": "Bordon_GW",
    }
    resp = client.post("/api/add-recorders", json={"model": minimal_model})
    data = resp.get_json()
    assert data["ok"] is True
    added_nodes = [a["node"] for a in data["data"]["added"]]
    assert "Bordon_GW" not in added_nodes  # already had one


# ---------------------------------------------------------------------------
# POST /api/export
# ---------------------------------------------------------------------------

def test_export_requires_absolute_path(client, minimal_model):
    resp = client.post("/api/export", json={
        "model": minimal_model,
        "output_path": "relative/output.json",
    })
    data = resp.get_json()
    assert data["ok"] is False
    assert "absolute" in data["error"].lower()


def test_export_blocks_on_errors(client, minimal_model):
    # Introduce an error
    minimal_model["nodes"].append({"name": "Bordon_GW", "type": "Input"})  # duplicate
    with tempfile.TemporaryDirectory() as tmpdir:
        out = os.path.join(tmpdir, "out.json")
        resp = client.post("/api/export", json={
            "model": minimal_model,
            "output_path": out,
        })
        data = resp.get_json()
        assert data["ok"] is False
        assert "error" in data["error"].lower()
        assert not os.path.exists(out)


def test_export_writes_parseable_file(client, minimal_model):
    with tempfile.TemporaryDirectory() as tmpdir:
        out = os.path.join(tmpdir, "exported_model.json")
        resp = client.post("/api/export", json={
            "model": minimal_model,
            "output_path": out,
        })
        data = resp.get_json()
        assert data["ok"] is True
        assert os.path.exists(out)

        with open(out, "r", encoding="utf-8") as f:
            reloaded = json.load(f)
        assert len(reloaded["nodes"]) == 3


def test_export_then_reparse(client, minimal_model):
    """Export a model, then re-parse it — should return same node/edge count."""
    with tempfile.TemporaryDirectory() as tmpdir:
        out = os.path.join(tmpdir, "round_trip.json")
        client.post("/api/export", json={
            "model": minimal_model,
            "output_path": out,
        })

        resp = client.post("/api/parse", json={"json_path": out})
        data = resp.get_json()
        assert data["ok"] is True
        assert len(data["data"]["nodes"]) == 3
        assert len(data["data"]["edges"]) == 2
