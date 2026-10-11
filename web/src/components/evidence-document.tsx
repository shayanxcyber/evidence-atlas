import { ArrowUpRight, FileText } from "lucide-react";
import type { Answer, Passage } from "../api";
import { name } from "../api";

export function AnswerText({
  answer,
  onOpen,
}: {
  answer: Answer;
  onOpen: (passage: Passage) => void;
}) {
  return (
    <div className="answer-body">
      {answer.answer.split("\n\n").map((paragraph, index) => (
        <p key={index}>
          {paragraph.split(/(\[S\d+\])/).map((part, i) => {
            const cite = answer.citations.find((c) => `[${c.label}]` === part);
            return cite ? (
              <CitationToken key={i} passage={cite} onOpen={onOpen} />
            ) : (
              <span key={i}>{part}</span>
            );
          })}
        </p>
      ))}
    </div>
  );
}

export function CitationToken({
  passage,
  onOpen,
}: {
  passage: Passage;
  onOpen: (passage: Passage) => void;
}) {
  return (
    <button
      className="citation"
      onClick={() => onOpen(passage)}
      aria-label={`Open source ${passage.label}`}
    >
      {passage.label}
    </button>
  );
}

export function SourceLines({
  content,
  startLine = 1,
  highlight,
}: {
  content: string;
  startLine?: number;
  highlight?: { start_line: number; end_line: number } | null;
}) {
  return (
    <div className="source-lines">
      {content.split("\n").map((line, index) => (
        <div
          key={index}
          className={
            !line
              ? "empty-line"
              : highlight &&
                  index + startLine >= highlight.start_line &&
                  index + startLine <= highlight.end_line
                ? "highlighted"
                : ""
          }
        >
          <span>{index + startLine}</span>
          <p>{line || " "}</p>
        </div>
      ))}
    </div>
  );
}

export function EvidenceTile({
  code,
  title,
  subtitle,
  relation,
  onOpen,
}: {
  code: string;
  title: string;
  subtitle: string;
  relation?: string;
  onOpen?: () => void;
}) {
  return (
    <button
      className={`evidence-tile ${relation ?? ""}`}
      onClick={onOpen}
      type="button"
    >
      <span className="tile-top">
        <FileText size={16} />
        <code>{code}</code>
        {relation && <span className="tile-relation">{relation}</span>}
      </span>
      <strong>{name(title)}</strong>
      <span className="tile-bottom">
        {subtitle}
        <ArrowUpRight size={14} />
      </span>
    </button>
  );
}

export function Metric({
  value,
  label,
  detail,
}: {
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div>
      <span className="eyebrow ink">{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}
