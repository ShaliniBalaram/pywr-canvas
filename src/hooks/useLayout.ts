// src/hooks/useLayout.ts
// Manages node positions and background image settings for the canvas.
// Reads/writes a .layout.json sidecar file alongside the model JSON file.
// The sidecar is never sent to the Flask backend — it is a frontend concern.

import { useState, useCallback } from "react";

interface NodePosition {
  x: number;
  y: number;
}

interface LayoutSidecar {
  version: 1;
  nodes: Record<string, NodePosition>;
  backgroundImage: string | null;
  backgroundOpacity: number;
}

export interface UseLayoutReturn {
  positions: Record<string, NodePosition>;
  backgroundImage: string | null;
  backgroundOpacity: number;
  setPosition: (nodeName: string, x: number, y: number) => void;
  setBackgroundImage: (path: string) => void;
  setBackgroundOpacity: (opacity: number) => void;
  loadLayout: (modelJsonPath: string) => Promise<void>;
  saveLayout: (modelJsonPath: string) => Promise<void>;
  autoLayout: (nodes: string[]) => void;
}

function sidecarPath(modelJsonPath: string): string {
  // Replace the .json extension with .layout.json
  return modelJsonPath.replace(/\.json$/, ".layout.json");
}

function clampOpacity(opacity: number): number {
  return Math.min(0.9, Math.max(0.1, opacity));
}

function computeAutoLayout(nodes: string[]): Record<string, NodePosition> {
  const COLS = 5;
  const H_SPACING = 200;
  const V_SPACING = 150;
  const START_X = 100;
  const START_Y = 100;

  const positions: Record<string, NodePosition> = {};
  nodes.forEach((name, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    positions[name] = {
      x: START_X + col * H_SPACING,
      y: START_Y + row * V_SPACING,
    };
  });
  return positions;
}

export function useLayout(): UseLayoutReturn {
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [backgroundImage, setBackgroundImageState] = useState<string | null>(null);
  const [backgroundOpacity, setBackgroundOpacityState] = useState<number>(0.4);

  const setPosition = useCallback((nodeName: string, x: number, y: number) => {
    setPositions((prev) => ({
      ...prev,
      [nodeName]: { x, y },
    }));
  }, []);

  const setBackgroundImage = useCallback((path: string) => {
    setBackgroundImageState(path);
  }, []);

  const setBackgroundOpacity = useCallback((opacity: number) => {
    setBackgroundOpacityState(clampOpacity(opacity));
  }, []);

  const autoLayout = useCallback((nodes: string[]) => {
    setPositions(computeAutoLayout(nodes));
  }, []);

  const loadLayout = useCallback(async (modelJsonPath: string) => {
    const path = sidecarPath(modelJsonPath);
    const raw = await window.pywr.readLayoutFile(path);

    if (raw === null) {
      // No sidecar exists — caller must invoke autoLayout with node names
      setPositions({});
      setBackgroundImageState(null);
      setBackgroundOpacityState(0.4);
      return;
    }

    const sidecar: LayoutSidecar = JSON.parse(raw);
    setPositions(sidecar.nodes ?? {});
    setBackgroundImageState(sidecar.backgroundImage ?? null);
    setBackgroundOpacityState(clampOpacity(sidecar.backgroundOpacity ?? 0.4));
  }, []);

  const saveLayout = useCallback(
    async (modelJsonPath: string) => {
      const path = sidecarPath(modelJsonPath);
      const sidecar: LayoutSidecar = {
        version: 1,
        nodes: positions,
        backgroundImage,
        backgroundOpacity,
      };
      await window.pywr.saveLayoutFile(path, JSON.stringify(sidecar, null, 2));
    },
    [positions, backgroundImage, backgroundOpacity]
  );

  return {
    positions,
    backgroundImage,
    backgroundOpacity,
    setPosition,
    setBackgroundImage,
    setBackgroundOpacity,
    loadLayout,
    saveLayout,
    autoLayout,
  };
}
