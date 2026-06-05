"use client";

import ReactFlow, { Background, Controls, Edge, MarkerType, Node } from "reactflow";
import "reactflow/dist/style.css";
import type { AnalysisResult } from "@/lib/types";

type ConceptMapProps = {
  analysis: AnalysisResult;
  theme: "dark" | "light";
};

export function ConceptMap({ analysis, theme }: ConceptMapProps) {
  const centerNodeId = analysis.themes[0]?.label ?? "Team Focus";
  const isDark = theme === "dark";

  // 1. Gather all unique nodes involved in the concept map
  const allNodeIdsSet = new Set<string>();
  allNodeIdsSet.add(centerNodeId);

  // Add all themes
  (analysis.themes || []).forEach((themeObj) => {
    if (themeObj.label) {
      allNodeIdsSet.add(themeObj.label);
    }
  });

  // Add any sources or targets from concept links to prevent empty/invisible edges
  (analysis.conceptLinks || []).forEach((link) => {
    if (link.source) allNodeIdsSet.add(link.source);
    if (link.target) allNodeIdsSet.add(link.target);
  });

  const allNodeIds = Array.from(allNodeIdsSet);

  // Map theme names to their original objects for index and group extraction
  const themesMap = new Map(
    analysis.themes.map((themeObj, idx) => [themeObj.label.toLowerCase().trim(), { theme: themeObj, index: idx }])
  );

  // 2. Compute non-overlapping radial layout positions
  const centerX = 350;
  const centerY = 220;

  // Split nodes into rings
  const themeNodes = allNodeIds.filter(
    (id) => id !== centerNodeId && themesMap.has(id.toLowerCase().trim())
  );
  const externalNodes = allNodeIds.filter(
    (id) => id !== centerNodeId && !themesMap.has(id.toLowerCase().trim())
  );

  const nodes: Node[] = [];

  // Add Center Node
  nodes.push({
    id: centerNodeId,
    position: { x: centerX - 75, y: centerY - 25 },
    data: { label: centerNodeId },
    style: {
      background: `linear-gradient(135deg, ${analysis.palette[0] || "#14b8a6"}, ${analysis.palette[1] || "#f472b6"})`,
      color: "#ffffff",
      border: "none",
      fontWeight: 800,
      borderRadius: 12,
      padding: "12px 18px",
      fontSize: "13px",
      textAlign: "center",
      boxShadow: isDark ? "0 10px 25px -5px rgba(20, 184, 166, 0.4)" : "0 10px 20px -5px rgba(20, 184, 166, 0.3)",
      width: 150,
      cursor: "grab"
    }
  });

  // Add Theme Nodes in Ring 1 (Radius = 150)
  themeNodes.forEach((id, idx) => {
    const angle = (idx / themeNodes.length) * 2 * Math.PI;
    const radius = 150;
    const x = centerX + radius * Math.cos(angle) - 70;
    const y = centerY + radius * Math.sin(angle) - 25;

    const themeInfo = themesMap.get(id.toLowerCase().trim());
    const themeIndex = themeInfo ? themeInfo.index : idx;
    const borderColor = analysis.palette[themeIndex % analysis.palette.length] || "#14b8a6";

    nodes.push({
      id,
      position: { x, y },
      data: { label: id },
      style: {
        background: isDark ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(4px)",
        border: `2px solid ${borderColor}`,
        borderRadius: 8,
        color: isDark ? "#ffffff" : "#000000",
        fontWeight: 600,
        padding: "8px 12px",
        fontSize: "12px",
        textAlign: "center",
        boxShadow: isDark ? "0 4px 12px rgba(0, 0, 0, 0.3)" : "0 4px 10px rgba(0, 0, 0, 0.05)",
        width: 140,
        cursor: "grab"
      }
    });
  });

  // Add External Nodes in Ring 2 (Radius = 260)
  externalNodes.forEach((id, idx) => {
    const angle = ((idx + 0.5) / (externalNodes.length || 1)) * 2 * Math.PI;
    const radius = 260;
    const x = centerX + radius * Math.cos(angle) - 65;
    const y = centerY + radius * Math.sin(angle) - 25;

    nodes.push({
      id,
      position: { x, y },
      data: { label: id },
      style: {
        background: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(248, 250, 252, 0.95)",
        border: isDark ? "1px dashed rgba(255, 255, 255, 0.25)" : "1px dashed rgba(15, 23, 42, 0.2)",
        borderRadius: 6,
        color: isDark ? "#f1f5f9" : "#1e293b",
        fontWeight: 500,
        padding: "6px 10px",
        fontSize: "11px",
        textAlign: "center",
        boxShadow: isDark ? "0 4px 10px rgba(0, 0, 0, 0.4)" : "0 4px 8px rgba(0, 0, 0, 0.03)",
        width: 130,
        cursor: "grab"
      }
    });
  });

  // 3. Connect Edges with styled arrows
  const edges: Edge[] = (analysis.conceptLinks || []).map((link, index) => {
    const strokeColor = analysis.palette[index % analysis.palette.length] || "#14b8a6";
    return {
      id: `${link.source}-${link.target}-${index}`,
      source: link.source,
      target: link.target,
      label: link.label,
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: strokeColor
      },
      style: {
        stroke: strokeColor,
        strokeWidth: 2
      },
      labelStyle: {
        fill: isDark ? "#ffffff" : "#000000",
        fontSize: 10,
        fontWeight: 600
      },
      labelBgStyle: {
        fill: isDark ? "#1e293b" : "#ffffff",
        fillOpacity: 0.9,
        rx: 4,
        ry: 4
      },
      labelBgPadding: [6, 3]
    };
  });

  return (
    <div className={`rounded-xl p-5 shadow-2xl border ${
      isDark ? "glass-panel border-white/5" : "bg-white border-slate-200"
    }`}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-400">Interactive Concept Map</h2>
      <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Interactive node network. Drag nodes to customize your layout.</p>
      <div className={`mt-4 h-96 overflow-hidden rounded-lg border ${
        isDark ? "border-white/5 bg-slate-950/60" : "border-slate-200 bg-slate-50"
      }`}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background gap={18} size={1} color={isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(15, 23, 42, 0.05)"} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
