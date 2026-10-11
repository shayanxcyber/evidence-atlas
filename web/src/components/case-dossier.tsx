import { ArrowUpRight, GitBranch } from "lucide-react";

export function CaseDossier({ onOpen }: { onOpen?: () => void }) {
  return (
    <button
      className="case-dossier"
      onClick={onOpen}
      aria-label="Inspect the evidence card"
    >
      <span className="dossier-spine">
        <GitBranch size={15} />
        Case file 01
      </span>
      <span className="dossier-copy">
        <small>Aster Relay · Release 2.4</small>
        <strong>
          A passing test.
          <br />A failing burst.
        </strong>
        <span>Two sources. One decision to revisit.</span>
      </span>
      <span className="dossier-contrast" aria-hidden="true">
        <span>
          <small>Steady load</small>
          <strong>
            118<span>ms</span>
          </strong>
        </span>
        <span>
          <small>Incident burst</small>
          <strong>
            12<span>s</span>
          </strong>
        </span>
      </span>
      <ArrowUpRight size={20} className="dossier-open" />
    </button>
  );
}
