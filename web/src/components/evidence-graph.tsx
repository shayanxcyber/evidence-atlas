import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  useNodesState,
} from "@xyflow/react";
import type { Edge, Node, NodeProps, ReactFlowInstance } from "@xyflow/react";
import { ArrowUpRight, FileText, GitBranch, List, Network } from "lucide-react";
import { EvidenceTile } from "./evidence-document";
import type { Passage, Source } from "../api";
import { name } from "../api";

type Link = Passage & { relation?: string; is_current?: boolean };
type EvidenceNode = Node<{
  title: string;
  subtitle: string;
  code: string;
  kind: "source" | "root";
  relation?: string;
  open?: () => void;
}>;

function MapNode({ data }: NodeProps<EvidenceNode>) {
  return (
    <div className={`atlas-node ${data.kind} ${data.relation ?? ""}`}>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <Handle type="source" position={Position.Right} isConnectable={false} />
      {data.kind === "root" ? (
        <div className="map-root-content">
          <Network size={24} />
          <span>{data.code}</span>
          <strong>{data.title}</strong>
          <small>{data.subtitle}</small>
        </div>
      ) : (
        <div className="nodrag">
          <EvidenceTile
            title={data.title}
            code={data.code}
            subtitle={data.subtitle}
            relation={data.relation}
            onOpen={data.open}
          />
        </div>
      )}
    </div>
  );
}

const nodeTypes = { evidence: MapNode };
const positions = [
  { x: 0, y: 0 },
  { x: 500, y: 0 },
  { x: 0, y: 140 },
  { x: 500, y: 140 },
  { x: 0, y: 280 },
  { x: 500, y: 280 },
  { x: 250, y: -45 },
  { x: 250, y: 350 },
];

export default function EvidenceGraph({
  sources,
  passages,
  claim,
  busy,
  onOpen,
}: {
  sources: Source[];
  passages?: Link[];
  claim?: string;
  busy?: boolean;
  onOpen: (documentId: string, version?: string, passage?: Passage) => void;
}) {
  const reduced = useReducedMotion();
  const [presentation, setPresentation] = useState<"map" | "list">(() =>
    window.matchMedia("(max-width: 780px)").matches ? "list" : "map",
  );
  const [instance, setInstance] = useState<ReactFlowInstance<
    EvidenceNode,
    Edge
  > | null>(null);
  const [focused, setFocused] = useState("");
  const data = useMemo(() => {
    const items = passages ?? sources;
    const visible = items.slice(0, 8);
    const nodes: EvidenceNode[] = [
      {
        id: "atlas-root",
        type: "evidence",
        position: { x: 250, y: 150 },
        draggable: true,
        data: {
          kind: "root",
          code: claim ? "CONCLUSION" : passages ? "RETRIEVAL" : "COLLECTION 01",
          title:
            claim ??
            (busy
              ? "Tracing sources…"
              : passages
                ? `${passages.length} sources found`
                : "Aster Relay"),
          subtitle: claim
            ? "Authored relationships"
            : passages
              ? "Open a source to inspect its lines"
              : `${sources.length} documents · release 2.4`,
        },
      },
    ];
    const edges: Edge[] = [];
    visible.forEach((item, index) => {
      const passage = passages?.[index];
      const id = `atlas-source-${index}`;
      const relation = passage?.relation;
      nodes.push({
        id,
        type: "evidence",
        position: positions[index],
        draggable: true,
        data: {
          kind: "source",
          title: name(item.title),
          code:
            relation ??
            passage?.label ??
            `DOC ${String(index + 1).padStart(2, "0")}`,
          subtitle: passage
            ? `L${passage.start_line}–${passage.end_line} / ${passage.sha256.slice(0, 8)}`
            : `${(item as Source).chunks} passages / ${item.sha256.slice(0, 8)}`,
          relation,
          open: () =>
            onOpen(
              passage?.document_id ?? item.id,
              passage?.version_id,
              passage,
            ),
        },
      });
      edges.push({
        id: `atlas-edge-${index}`,
        source: index % 2 ? "atlas-root" : id,
        target: index % 2 ? id : "atlas-root",
        type: "smoothstep",
        animated: busy && !reduced,
        label: relation ?? (passage ? `#${index + 1}` : undefined),
        style: {
          stroke:
            relation === "contradicts"
              ? "#a84630"
              : relation === "supports"
                ? "#52694d"
                : passages
                  ? "#85866f"
                  : "#b3b5a5",
          strokeWidth: passages ? 1.5 : 1,
        },
        labelStyle: { fill: "#525b4c", fontSize: 12 },
        labelBgStyle: { fill: "#f7f7ef" },
      });
    });
    return { nodes, edges, total: items.length };
  }, [sources, passages, claim, busy, reduced, onOpen]);
  const [nodes, setNodes, onNodesChange] = useNodesState<EvidenceNode>(
    data.nodes,
  );
  useEffect(() => {
    setNodes(data.nodes);
  }, [data.nodes, setNodes]);
  useEffect(() => {
    if (instance)
      void instance.fitView({ padding: 0.08, duration: reduced ? 0 : 400 });
  }, [instance, data.nodes, reduced]);

  return (
    <section
      className="evidence-canvas"
      aria-label={
        claim ? "Evidence relationship map" : "Interactive source map"
      }
    >
      <div className="canvas-topline">
        <span>
          <GitBranch size={14} />
          {claim ? "EVIDENCE MAP" : passages ? "RETRIEVAL MAP" : "SOURCE MAP"}
        </span>
        <div className="canvas-tools">
          <small>
            {presentation === "map" && data.total > 8
              ? `8 OF ${data.total}`
              : data.total}{" "}
            SOURCES
          </small>
          <div role="group" aria-label="Source map presentation">
            <button
              aria-label="Map view"
              aria-pressed={presentation === "map"}
              onClick={() => setPresentation("map")}
            >
              <Network size={14} />
            </button>
            <button
              aria-label="List view"
              aria-pressed={presentation === "list"}
              onClick={() => setPresentation("list")}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>
      {presentation === "map" ? (
        <div className="graph-stage">
          <ReactFlow<EvidenceNode, Edge>
            nodes={nodes}
            edges={data.edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onInit={setInstance}
            fitView
            fitViewOptions={{ padding: 0.08 }}
            minZoom={0.3}
            maxZoom={1.8}
            nodesConnectable={false}
            edgesFocusable={false}
            nodesFocusable
            elementsSelectable={false}
            zoomOnScroll={false}
            preventScrolling={false}
            colorMode="light"
            onNodeMouseEnter={(_, node) => setFocused(node.id)}
            onNodeMouseLeave={() => setFocused("")}
            className={focused ? "has-focused-node" : ""}
            proOptions={{ hideAttribution: false }}
          >
            <Background gap={24} size={1} color="#d7d7cb" />
            <Controls showInteractive={false} position="bottom-right" />
          </ReactFlow>
        </div>
      ) : (
        <div className="source-map-list" aria-label="Mapped sources">
          <div className="map-list-root">
            <Network size={18} />
            <span>
              {claim ??
                (passages ? "Retrieved passages" : "Aster Relay collection")}
            </span>
          </div>
          {(passages ?? sources).map((item, index) => {
            const passage = passages?.[index];
            return (
              <button
                key={item.id}
                onClick={() =>
                  onOpen(
                    passage?.document_id ?? item.id,
                    passage?.version_id,
                    passage,
                  )
                }
              >
                <FileText size={18} />
                <span>
                  <strong>{name(item.title)}</strong>
                  <small>
                    {passage
                      ? `${passage.label ?? passage.relation ?? "Source"} · lines ${passage.start_line}–${passage.end_line}`
                      : `${(item as Source).chunks} passages`}{" "}
                    · {item.sha256.slice(0, 8)}
                  </small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            );
          })}
          {data.total === 0 && <p>No source passages to display yet.</p>}
        </div>
      )}
      <div className="canvas-caption">
        <span className="signal-dot" />
        <span>
          {presentation === "list"
            ? "Select a document to read its source."
            : "Drag to arrange. Use + / − to zoom."}
        </span>
        {presentation === "map" && data.total > 8 && (
          <button onClick={() => setPresentation("list")}>
            See all {data.total}
          </button>
        )}
      </div>
    </section>
  );
}
