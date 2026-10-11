import { useState } from "react";
import { ArrowUpRight, FileText, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Source } from "../api";

const conditions = [
  {
    id: "steady",
    title: "Steady state",
    reference: "LT-24",
    file: "load-test.md",
    rate: 600,
    tenants: "16 tenants",
    latency: 118,
    display: "118",
    unit: "ms",
    queue: "Below 400",
    finding:
      "The steady-state gates passed. Sudden bursts were outside this test.",
    color: "#466048",
  },
  {
    id: "burst",
    title: "Incident burst",
    reference: "IR-08",
    file: "incident-review.md",
    rate: 4000,
    tenants: "One tenant",
    latency: 12000,
    display: "12",
    unit: "s",
    queue: "18,000",
    finding:
      "The retry scheduler congested. The guard watched gateway latency instead of queue age.",
    color: "#a84f32",
  },
] as const;

export function InvestigationBrief({
  sources,
  onOpen,
  onInvestigate,
}: {
  sources: Source[];
  onOpen: (documentId: string, version?: string) => void;
  onInvestigate: () => void;
}) {
  const [selected, setSelected] = useState(1);
  const reduced = useReducedMotion();
  const condition = conditions[selected];
  const source = sources.find((item) => item.title === condition.file);
  const transition = {
    duration: reduced ? 0 : 0.45,
    ease: [0.22, 1, 0.36, 1] as const,
  };
  return (
    <section className="investigation-brief" aria-label="Release investigation">
      <div className="brief-index">
        <span>FIELD NOTES / 01</span>
        <span>ASTER RELAY · 2.4</span>
      </div>
      <h2>
        A passing test.
        <br />
        <em>A failing burst.</em>
      </h2>
      <div
        className="condition-switch"
        role="group"
        aria-label="Traffic condition"
      >
        {conditions.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={index === selected}
            onClick={() => setSelected(index)}
          >
            {index === selected && (
              <motion.span
                className="condition-indicator"
                layoutId="traffic-condition"
                transition={transition}
              />
            )}
            <span>{item.title}</span>
            <small>{item.reference}</small>
          </button>
        ))}
      </div>
      <div className="traffic-study">
        <div className="traffic-caption">
          <span>INCOMING EVENTS</span>
          <span>{condition.tenants}</span>
        </div>
        <svg
          viewBox="0 0 480 80"
          role="img"
          aria-label={`${condition.rate.toLocaleString()} events per second; each dot represents 100 events per second`}
        >
          {Array.from({ length: 40 }, (_, index) => (
            <motion.circle
              key={index}
              cx={15 + (index % 20) * 23.5}
              cy={index < 20 ? 22 : 54}
              r={6}
              animate={{
                opacity: index < condition.rate / 100 ? 1 : 0.12,
                fill: condition.color,
              }}
              transition={{ ...transition, delay: reduced ? 0 : index * 0.006 }}
            />
          ))}
        </svg>
        <div className="traffic-key">
          <strong>
            {condition.rate.toLocaleString()}
            <small>events / second</small>
          </strong>
          <span>● = 100 events / s</span>
        </div>
      </div>
      <div className="brief-measures" aria-live="polite" aria-atomic="true">
        <div>
          <span>Dispatch p95</span>
          <strong style={{ color: condition.color }}>
            {condition.display}
            <small>{condition.unit}</small>
          </strong>
        </div>
        <div>
          <span>Queue depth</span>
          <strong>
            {condition.queue}
            <small>events</small>
          </strong>
        </div>
      </div>
      <div
        className="latency-scale"
        aria-label="Dispatch latency on a shared zero to twelve second scale"
      >
        <motion.div
          animate={{
            width: `${(condition.latency / 12000) * 100}%`,
            background: condition.color,
          }}
          transition={transition}
        />
        <span>0</span>
        <span>12 seconds</span>
      </div>
      <p className="brief-finding">{condition.finding}</p>
      <div className="brief-actions">
        <button
          disabled={!source}
          onClick={() => source && onOpen(source.id, source.active_version_id)}
        >
          <FileText size={14} />
          <span>Read {condition.reference}</span>
          <ArrowUpRight size={14} />
        </button>
        <button onClick={onInvestigate}>
          Follow the discrepancy
          <ArrowRight size={15} />
        </button>
      </div>
      <span className="brief-disclaimer">
        Invented measurements from the included fictional sources.
      </span>
    </section>
  );
}
