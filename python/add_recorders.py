# python/add_recorders.py — recorder injection logic
# Adds NumpyArray recorders to all nodes that lack one.
# Recorder assignment rules from TASKS.md Task 17.
# Does NOT write to disk — returns the modified model dict and list of additions.

from typing import Any


# Recorder type constants — names from PYWR_SCHEMA.md (use NumpyArrayNodeDeficitRecorder)
RECORDER_NODE = "NumpyArrayNodeRecorder"
RECORDER_DEFICIT = "NumpyArrayNodeDeficitRecorder"
RECORDER_STORAGE = "NumpyArrayStorageRecorder"
RECORDER_NORMALISED = "NumpyArrayNormalisedStorageRecorder"

# Node types that get NumpyArrayStorageRecorder
STORAGE_TYPES = {"storage", "annualvirtualstorage"}

# Node types that get NumpyArrayNodeRecorder
NODE_RECORDER_TYPES = {
    "input", "output", "link", "river", "rivergauge", "catchment",
    "piecewiselink", "riversplithwithgauge",
}

# Virtual/aggregation types that do not get recorders via this route
SKIP_TYPES = {"aggregatednode", "aggregatedstorage", "virtualstorage"}


def _type_key(t: str) -> str:
    return t.lower()


def _recorder_name_already_exists(
    recorder_type: str,
    node_name: str,
    recorders: dict[str, Any],
) -> bool:
    """Return True if a recorder of the given type already targets node_name."""
    for rec_cfg in recorders.values():
        if (
            isinstance(rec_cfg, dict)
            and rec_cfg.get("type") == recorder_type
            and rec_cfg.get("node") == node_name
        ):
            return True
    return False


def add_recorders(model: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, str]]]:
    """
    Add appropriate NumpyArray recorders to all nodes that lack one.

    Returns:
        (modified_model, added_list)
        where added_list is a list of {"recorder_type": "...", "node": "..."} dicts.
    """
    import copy
    model = copy.deepcopy(model)

    nodes: list[dict[str, Any]] = model.get("nodes", [])
    recorders: dict[str, Any] = model.get("recorders", {})
    if not isinstance(recorders, dict):
        recorders = {}
        model["recorders"] = recorders

    added: list[dict[str, str]] = []

    for node in nodes:
        name = node.get("name")
        node_type = node.get("type", "")
        if not name or not node_type:
            continue

        tk = _type_key(node_type)

        if tk in SKIP_TYPES:
            continue

        if tk in STORAGE_TYPES:
            # NumpyArrayStorageRecorder
            if not _recorder_name_already_exists(RECORDER_STORAGE, name, recorders):
                rec_name = f"{name}_recorder"
                recorders[rec_name] = {"type": RECORDER_STORAGE, "node": name}
                added.append({"recorder_type": RECORDER_STORAGE, "node": name})

            # AnnualVirtualStorage also gets NumpyArrayNormalisedStorageRecorder
            if tk == "annualvirtualstorage":
                if not _recorder_name_already_exists(RECORDER_NORMALISED, name, recorders):
                    rec_name = f"{name}_normalised_recorder"
                    recorders[rec_name] = {"type": RECORDER_NORMALISED, "node": name}
                    added.append({"recorder_type": RECORDER_NORMALISED, "node": name})

        elif tk in NODE_RECORDER_TYPES:
            # NumpyArrayNodeRecorder for all flow nodes
            if not _recorder_name_already_exists(RECORDER_NODE, name, recorders):
                rec_name = f"{name}_recorder"
                recorders[rec_name] = {"type": RECORDER_NODE, "node": name}
                added.append({"recorder_type": RECORDER_NODE, "node": name})

            # Output nodes ending in _DC also get NumpyArrayNodeDeficitRecorder
            if tk == "output" and name.endswith("_DC"):
                if not _recorder_name_already_exists(RECORDER_DEFICIT, name, recorders):
                    rec_name = f"{name}_deficit_recorder"
                    recorders[rec_name] = {"type": RECORDER_DEFICIT, "node": name}
                    added.append({"recorder_type": RECORDER_DEFICIT, "node": name})

    model["recorders"] = recorders
    return model, added
