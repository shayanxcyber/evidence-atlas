import type { Evaluation } from "../api";

export function RetrievalAssay({
  cases,
  onInspect,
  progress = 1,
}: {
  cases: Evaluation["cases"];
  onInspect?: (row: Evaluation["cases"][number]) => void;
  progress?: number;
}) {
  return (
    <section className="retrieval-assay" aria-label="Question coverage">
      <div className="assay-heading">
        <span>QUESTION COVERAGE</span>
        <span>Each mark is an expected source</span>
      </div>
      <div className="assay-strip">
        {cases.map((row, index) => (
          <button
            key={row.id}
            type="button"
            className={row.recall < 1 ? "has-gap" : ""}
            style={{
              opacity: Math.min(
                1,
                Math.max(0, progress * cases.length - index),
              ),
            }}
            onClick={() => onInspect?.(row)}
            aria-label={`Inspect ${row.id}: ${Math.round(row.recall * 100)} percent of expected sources found`}
          >
            <span className="assay-marks">
              {row.expected_sources.map((title) => (
                <i
                  key={title}
                  className={
                    row.found_sources.includes(title) ? "found" : "missing"
                  }
                />
              ))}
            </span>
            <span>{row.id}</span>
          </button>
        ))}
      </div>
      <div className="assay-legend">
        <span>
          <i /> Retrieved
        </span>
        <span>
          <i /> Missing
        </span>
        <span>Open a question to inspect its passages.</span>
      </div>
    </section>
  );
}
