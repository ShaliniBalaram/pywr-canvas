// electron/add_recorders.js
// Port of python/add_recorders.py — recorder injection logic in Node.js.
// Adds NumpyArray recorders to all nodes that lack one.
// Does NOT write to disk — returns { model, added }.

'use strict';

const RECORDER_NODE       = 'NumpyArrayNodeRecorder';
const RECORDER_DEFICIT    = 'NumpyArrayNodeDeficitRecorder';
const RECORDER_STORAGE    = 'NumpyArrayStorageRecorder';
const RECORDER_NORMALISED = 'NumpyArrayNormalisedStorageRecorder';

const STORAGE_TYPES = new Set(['storage', 'annualvirtualstorage']);

const NODE_RECORDER_TYPES = new Set([
  'input', 'output', 'link', 'river', 'rivergauge', 'catchment',
  'piecewiselink', 'riversplithwithgauge',
]);

const SKIP_TYPES = new Set(['aggregatednode', 'aggregatedstorage', 'virtualstorage']);

function tk(t) { return (t || '').toLowerCase(); }

function recorderAlreadyExists(recorderType, nodeName, recorders) {
  for (const rec of Object.values(recorders)) {
    if (rec && typeof rec === 'object' && rec.type === recorderType && rec.node === nodeName) {
      return true;
    }
  }
  return false;
}

function addRecorders(model) {
  // Deep clone so we don't mutate the caller's object
  model = JSON.parse(JSON.stringify(model));

  const nodes = Array.isArray(model.nodes) ? model.nodes : [];
  if (!model.recorders || typeof model.recorders !== 'object' || Array.isArray(model.recorders)) {
    model.recorders = {};
  }
  const recorders = model.recorders;
  const added = [];

  for (const node of nodes) {
    const name = node.name;
    const nodeType = node.type;
    if (!name || !nodeType) continue;

    const key = tk(nodeType);
    if (SKIP_TYPES.has(key)) continue;

    if (STORAGE_TYPES.has(key)) {
      if (!recorderAlreadyExists(RECORDER_STORAGE, name, recorders)) {
        recorders[`${name}_recorder`] = { type: RECORDER_STORAGE, node: name };
        added.push({ recorder_type: RECORDER_STORAGE, node: name });
      }
      // AnnualVirtualStorage also gets a normalised recorder
      if (key === 'annualvirtualstorage' && !recorderAlreadyExists(RECORDER_NORMALISED, name, recorders)) {
        recorders[`${name}_normalised_recorder`] = { type: RECORDER_NORMALISED, node: name };
        added.push({ recorder_type: RECORDER_NORMALISED, node: name });
      }
    } else if (NODE_RECORDER_TYPES.has(key)) {
      if (!recorderAlreadyExists(RECORDER_NODE, name, recorders)) {
        recorders[`${name}_recorder`] = { type: RECORDER_NODE, node: name };
        added.push({ recorder_type: RECORDER_NODE, node: name });
      }
      // Output nodes ending in _DC also get a deficit recorder
      if (key === 'output' && name.endsWith('_DC') && !recorderAlreadyExists(RECORDER_DEFICIT, name, recorders)) {
        recorders[`${name}_deficit_recorder`] = { type: RECORDER_DEFICIT, node: name };
        added.push({ recorder_type: RECORDER_DEFICIT, node: name });
      }
    }
  }

  model.recorders = recorders;
  return { model, added };
}

module.exports = { addRecorders };
