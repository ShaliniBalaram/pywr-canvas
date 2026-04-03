// electron/pywr_schema.js
// Port of python/pywr_schema.py — Pywr model schema validation in Node.js.
// No Python or Flask required.

'use strict';

const VALID_NODE_TYPES = new Set([
  // Core
  'input', 'output', 'link', 'catchment', 'discharge',
  'losslink', 'breaklink', 'delaynode',
  // Multi-output
  'piecewiselink', 'multisplitlink',
  // Storage
  'storage', 'reservoir',
  // Virtual storage / licence
  'virtualstorage', 'annualvirtualstorage', 'seasonalvirtualstorage',
  'monthlyvirtualstorage', 'rollingvirtualstorage',
  // Aggregation
  'aggregatednode', 'aggregatedstorage',
  // River domain
  'river', 'rivergauge', 'riversplit', 'riversplithwithgauge',
  // Groundwater
  'keatingaquifer',
]);

const NODE_REQUIRED_FIELDS = {
  input:                    [],
  output:                   [],
  link:                     [],
  catchment:                [],
  discharge:                [],
  losslink:                 [],
  breaklink:                [],
  delaynode:                [],
  piecewiselink:            ['nsteps'],
  multisplitlink:           [],
  storage:                  ['max_volume'],
  reservoir:                [],
  virtualstorage:           ['nodes'],
  annualvirtualstorage:     ['nodes', 'max_volume'],
  seasonalvirtualstorage:   ['nodes'],
  monthlyvirtualstorage:    ['nodes'],
  rollingvirtualstorage:    ['nodes'],
  aggregatednode:           ['nodes'],
  aggregatedstorage:        ['storages'],
  river:                    [],
  rivergauge:               [],
  riversplit:               [],
  riversplithwithgauge:     [],
  keatingaquifer:           [],
};

const SOURCE_TYPES = new Set(['input', 'catchment', 'discharge']);

const VIRTUAL_TYPES = new Set([
  'aggregatednode', 'aggregatedstorage',
  'virtualstorage', 'annualvirtualstorage',
  'seasonalvirtualstorage', 'monthlyvirtualstorage', 'rollingvirtualstorage',
]);

function tk(t) { return (t || '').toLowerCase(); }

function validateNode(node) {
  const issues = [];
  let name = node.name;

  if (!name || typeof name !== 'string' || !name.trim()) {
    issues.push({ code: 'MISSING_REQUIRED_FIELD', severity: 'error', message: "Node is missing a valid 'name' field", node_name: '' });
    name = '<unnamed>';
  }

  const nodeType = node.type;
  if (!nodeType || typeof nodeType !== 'string') {
    issues.push({ code: 'MISSING_REQUIRED_FIELD', severity: 'error', message: `Node '${name}' is missing a valid 'type' field`, node_name: name });
    return issues;
  }

  const key = tk(nodeType);
  if (!VALID_NODE_TYPES.has(key)) {
    issues.push({ code: 'INVALID_NODE_TYPE', severity: 'error', message: `Node '${name}' has unknown type '${nodeType}'`, node_name: name });
    return issues;
  }

  for (const field of (NODE_REQUIRED_FIELDS[key] || [])) {
    if (!(field in node)) {
      issues.push({ code: 'MISSING_REQUIRED_FIELD', severity: 'error', message: `Node '${name}' (type '${nodeType}') is missing required field '${field}'`, node_name: name });
    }
  }

  return issues;
}

function validateEdges(edges, nodeNames) {
  const issues = [];
  edges.forEach((edge, i) => {
    const fn = edge.from_node;
    const tn = edge.to_node;

    if (!fn || typeof fn !== 'string') {
      issues.push({ code: 'ORPHANED_EDGE', severity: 'error', message: `Edge ${i} is missing 'from_node'`, node_name: '' });
    } else if (!nodeNames.has(fn)) {
      issues.push({ code: 'ORPHANED_EDGE', severity: 'error', message: `Edge ${i} references unknown from_node '${fn}'`, node_name: fn });
    }

    if (!tn || typeof tn !== 'string') {
      issues.push({ code: 'ORPHANED_EDGE', severity: 'error', message: `Edge ${i} is missing 'to_node'`, node_name: '' });
    } else if (!nodeNames.has(tn)) {
      issues.push({ code: 'ORPHANED_EDGE', severity: 'error', message: `Edge ${i} references unknown to_node '${tn}'`, node_name: tn });
    }
  });
  return issues;
}

function validateModel(model) {
  const issues = [];

  if (!model || typeof model !== 'object' || Array.isArray(model)) {
    issues.push({ code: 'MODEL_STRUCTURE_ERROR', severity: 'error', message: 'Model must be a JSON object', node_name: '' });
    return issues;
  }

  let nodesRaw = model.nodes;
  let edgesRaw = model.edges;
  const timestepper = model.timestepper;
  const recordersRaw = model.recorders || {};

  if (nodesRaw == null) {
    issues.push({ code: 'MODEL_STRUCTURE_ERROR', severity: 'error', message: "Model is missing 'nodes' array", node_name: '' });
  } else if (!Array.isArray(nodesRaw)) {
    issues.push({ code: 'MODEL_STRUCTURE_ERROR', severity: 'error', message: "'nodes' must be an array", node_name: '' });
    nodesRaw = [];
  }

  if (edgesRaw == null) {
    issues.push({ code: 'MODEL_STRUCTURE_ERROR', severity: 'warning', message: "Model has no 'edges' array", node_name: '' });
    edgesRaw = [];
  } else if (!Array.isArray(edgesRaw)) {
    issues.push({ code: 'MODEL_STRUCTURE_ERROR', severity: 'error', message: "'edges' must be an array", node_name: '' });
    edgesRaw = [];
  }

  if (timestepper == null) {
    issues.push({ code: 'MODEL_STRUCTURE_ERROR', severity: 'error', message: "Model is missing 'timestepper'", node_name: '' });
  } else if (typeof timestepper !== 'object' || Array.isArray(timestepper)) {
    issues.push({ code: 'MODEL_STRUCTURE_ERROR', severity: 'error', message: "'timestepper' must be an object", node_name: '' });
  } else {
    for (const f of ['start', 'end', 'timestep']) {
      if (!(f in timestepper)) {
        issues.push({ code: 'MISSING_REQUIRED_FIELD', severity: 'error', message: `'timestepper' is missing required field '${f}'`, node_name: '' });
      }
    }
  }

  if (!Array.isArray(nodesRaw)) return issues;

  // Validate nodes, collect names
  const nodeNames = new Set();
  const nodeTypesByName = {};
  for (const node of nodesRaw) {
    issues.push(...validateNode(node));
    const name = node.name;
    if (name && typeof name === 'string') {
      if (nodeNames.has(name)) {
        issues.push({ code: 'DUPLICATE_NODE_NAME', severity: 'error', message: `Duplicate node name '${name}'`, node_name: name });
      }
      nodeNames.add(name);
      nodeTypesByName[name] = node.type || '';
    }
  }

  // Validate edges
  issues.push(...validateEdges(edgesRaw, nodeNames));

  // Unconnected node warnings
  const connectedNodes = new Set();
  for (const edge of edgesRaw) {
    if (edge.from_node) connectedNodes.add(edge.from_node);
    if (edge.to_node) connectedNodes.add(edge.to_node);
  }
  for (const node of nodesRaw) {
    const name = node.name;
    if (name && !VIRTUAL_TYPES.has(tk(node.type)) && !connectedNodes.has(name)) {
      issues.push({ code: 'UNCONNECTED_NODE', severity: 'warning', message: `Node '${name}' is not connected to any edge`, node_name: name });
    }
  }

  // No recorder warnings
  const recordersByNode = new Set();
  const recCfgs = Array.isArray(recordersRaw) ? recordersRaw : Object.values(recordersRaw);
  for (const rec of recCfgs) {
    if (rec && typeof rec === 'object') {
      const ref = rec.node || rec.param;
      if (ref && typeof ref === 'string') recordersByNode.add(ref);
    }
  }
  for (const node of nodesRaw) {
    const name = node.name;
    if (name && !VIRTUAL_TYPES.has(tk(node.type)) && !recordersByNode.has(name)) {
      issues.push({ code: 'NO_RECORDER', severity: 'warning', message: `Node '${name}' has no recorder attached`, node_name: name });
    }
  }

  // Unreachable demand warnings (BFS upstream from each Output)
  const reverseAdj = {};
  for (const name of nodeNames) reverseAdj[name] = [];
  for (const edge of edgesRaw) {
    const fn = edge.from_node;
    const tn = edge.to_node;
    if (fn && tn && nodeNames.has(fn) && nodeNames.has(tn)) {
      reverseAdj[tn].push(fn);
    }
  }
  for (const node of nodesRaw) {
    const name = node.name;
    if (!name || tk(node.type) !== 'output') continue;
    const visited = new Set();
    const queue = [name];
    let foundSource = false;
    while (queue.length && !foundSource) {
      const current = queue.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      if (SOURCE_TYPES.has(tk(nodeTypesByName[current] || '')) && current !== name) {
        foundSource = true;
        break;
      }
      queue.push(...(reverseAdj[current] || []));
    }
    if (!foundSource) {
      issues.push({ code: 'UNREACHABLE_DEMAND', severity: 'warning', message: `Output node '${name}' has no upstream path to any Input or Catchment`, node_name: name });
    }
  }

  return issues;
}

module.exports = { validateModel };
