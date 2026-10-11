import { useEffect, useMemo, useState } from "react";
import { FileText, LoaderCircle } from "lucide-react";
import { AtlasSelect } from "./atlas-select";
import { api } from "../api";
import type { SourceDetail } from "../api";
import { changedLines } from "../lib/changed-lines";

// Two-pane structure adapted from Magic UI's Code Comparison. Source text stays
// in React text nodes; imported documents are never treated as highlighted HTML.
export function VersionComparison({ source }: { source: SourceDetail }) {
  const alternatives = source.versions.filter(
    (version) => version.id !== source.version_id,
  );
  const [version, setVersion] = useState(
    alternatives.find((item) => item.id === source.active_version_id)?.id ??
      alternatives[0]?.id ??
      "",
  );
  const [other, setOther] = useState<SourceDetail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setOther(null);
    setError("");
    if (version)
      void api<SourceDetail>(
        `/documents/${source.id}?version=${encodeURIComponent(version)}`,
        { signal: controller.signal },
      )
        .then((result) => {
          if (!controller.signal.aborted) setOther(result);
        })
        .catch((failure: Error) => {
          if (!controller.signal.aborted) setError(failure.message);
        });
    return () => controller.abort();
  }, [source.id, version]);
  return (
    <section
      className="version-comparison"
      aria-label="Source version comparison"
    >
      <label className="comparison-select">
        Compare with
        <AtlasSelect
          label="Comparison version"
          value={version}
          onChange={setVersion}
          options={alternatives.map((item) => ({
            value: item.id,
            label: item.sha256.slice(0, 10),
            description:
              item.id === source.active_version_id
                ? "Current version"
                : "Retained earlier version",
          }))}
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!other && !error && (
        <p className="comparison-loading" role="status">
          <LoaderCircle className="spin" size={16} />
          Opening comparison version…
        </p>
      )}
      {other && (
        <>
          <div className="comparison-panes">
            <VersionPane
              source={source}
              comparison={other}
              label="Selected source"
            />
            <VersionPane
              source={other}
              comparison={source}
              label={
                other.version_id === source.active_version_id
                  ? "Current version"
                  : "Earlier version"
              }
            />
          </div>
          <p className="comparison-note">
            {source.content === other.content
              ? "These versions have identical text."
              : "The source text changed between these versions."}{" "}
            Highlighted rows differ from the other version. Line numbers belong
            to each version independently.
          </p>
        </>
      )}
    </section>
  );
}

export function VersionPane({
  source,
  label,
  comparison,
}: {
  source: SourceDetail;
  label: string;
  comparison?: SourceDetail;
}) {
  const lines = source.content.split("\n");
  const changes = useMemo(
    () =>
      comparison
        ? changedLines(source.content, comparison.content)
        : new Set<number>(),
    [source.content, comparison?.content],
  );
  return (
    <section aria-label={label}>
      <header>
        <FileText size={14} />
        <span>{label}</span>
        <code>{source.sha256.slice(0, 8)}</code>
      </header>
      <div className="comparison-lines">
        {lines.slice(0, 240).map((line, index) => (
          <div key={index} data-changed={changes.has(index) || undefined}>
            <span title={changes.has(index) ? "Changed line" : undefined}>
              {index + 1}
              {changes.has(index) && <b aria-label="Changed line">•</b>}
            </span>
            <code>{line || " "}</code>
          </div>
        ))}
      </div>
      {lines.length > 240 && (
        <p className="comparison-note">
          Showing the first 240 of {lines.length} lines. Use Original text to
          read the complete selected version.
        </p>
      )}
    </section>
  );
}
