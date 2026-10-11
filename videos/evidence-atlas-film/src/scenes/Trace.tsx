import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  AnswerText,
  SourceLines,
  CitationToken,
} from "../../../../web/src/components/evidence-document";
import type { Passage } from "../../../../web/src/api";
import fixture from "../fixtures.json";
import { World, Thread, motionValue, inert } from "../world";
export function Trace() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hit: Passage = { ...fixture.incident, label: "S1" };
  const inspection =
    motionValue(f, 4.2 * fps, 5.2 * fps, 1, 1.07) -
    motionValue(f, 7.4 * fps, 8.3 * fps, 0, 0.07);
  const answer = {
    answer:
      "[S1] The overload guard incorrectly used gateway latency instead of queue age.",
    citations: [hit],
    mode: "evidence",
    status: "complete",
  };
  return (
    <World chapter="02 / FOLLOW THE CITATION">
      <div
        className="film-headline"
        style={{
          left: 135,
          top: 150,
          translate: `0 ${motionValue(f, 0, 0.7 * fps, 30, 0)}px`,
        }}
      >
        <span className="film-eyebrow">A result with somewhere to go.</span>
        <h1>
          Open the source.
          <br />
          <em>Read what changed.</em>
        </h1>
      </div>
      <Thread
        path="M 850 670 C 935 670 942 585 942 485 S 995 325 1070 325"
        progress={motionValue(f, 0.3 * fps, 2.3 * fps)}
        clearAreas={[
          { x: 65, y: 470, width: 830, height: 310 },
          { x: 925, y: 335, width: 940, height: 610 },
          { x: 145, y: 765, width: 640, height: 165 },
          { x: 960, y: 935, width: 800, height: 55 },
        ]}
      />
      <div
        className="film-answer"
        style={{
          left: 135,
          top: 500,
          width: 740,
          opacity: motionValue(f, 0.4 * fps, 0.9 * fps),
          translate: `${motionValue(f, 0.4 * fps, 1.2 * fps, -50, 0)}px 0`,
          scale: motionValue(f, 3 * fps, 3.7 * fps, 1, 0.92),
          transformOrigin: "left center",
        }}
      >
        <div className="film-pane-header">
          Evidence answer <span>ONE CITED PASSAGE</span>
        </div>
        <AnswerText answer={answer} onOpen={inert} />
      </div>
      <div
        className="film-citation-carrier"
        style={{
          left: 909,
          top: motionValue(f, 2.2 * fps, 3.6 * fps, 615, 470),
          opacity:
            motionValue(f, 2 * fps, 2.15 * fps) *
            motionValue(f, 3.8 * fps, 4.1 * fps, 1, 0),
        }}
      >
        <CitationToken passage={hit} onOpen={inert} />
      </div>
      <div
        className="film-source"
        style={{
          left: 990,
          top: 380,
          width: 790,
          opacity: motionValue(f, 2.8 * fps, 3.3 * fps),
          translate: `${motionValue(f, 2.8 * fps, 3.7 * fps, 75, 0)}px 0`,
          scale: inspection,
          transformOrigin: "right center",
          rotate: `${motionValue(f, 2.8 * fps, 3.7 * fps, 3, 0)}deg`,
        }}
      >
        <div className="film-pane-header">
          incident-review.md<span>ea76bee1 · RETAINED VERSION</span>
        </div>
        <SourceLines
          content={hit.body.split("\n").slice(5, 12).join("\n")}
          startLine={6}
          highlight={
            f > 4.3 * fps
              ? { start_line: 12, end_line: 12 }
              : { start_line: 9, end_line: 9 }
          }
        />
      </div>
      <div
        className="film-margin"
        style={{
          left: 170,
          top: 785,
          opacity: motionValue(f, 4.6 * fps, 5.2 * fps),
        }}
      >
        Original text.
        <br />
        Exact lines.
        <br />A version that stays put.
      </div>
      <div
        className="film-annotation"
        style={{
          left: 990,
          top: 950,
          opacity: motionValue(f, 6.2 * fps, 6.7 * fps),
        }}
      >
        Line 12 changes the decision. <span>↗</span>
      </div>
    </World>
  );
}
