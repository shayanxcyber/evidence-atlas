import { useCurrentFrame, useVideoConfig } from "remotion";
import { CaseDossier } from "../../../../web/src/components/case-dossier";
import { EvidenceTile } from "../../../../web/src/components/evidence-document";
import { World, Thread, motionValue, inert } from "../world";
export function Question() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <World chapter="01 / A QUESTION WORTH ASKING">
      <div
        className="film-headline"
        style={{
          left: 135,
          top: 140,
          opacity: motionValue(f, 0, 0.5 * fps),
          translate: `0 ${motionValue(f, 0, 0.8 * fps, 40, 0)}px`,
        }}
      >
        <span className="film-eyebrow">
          A passing test isn’t the whole story.
        </span>
        <h1>
          What changed
          <br />
          <em>under load?</em>
        </h1>
      </div>
      <div
        className="film-dossier"
        style={{
          left: 950,
          top: 250,
          width: 670,
          rotate: `${motionValue(f, 0, 1.3 * fps, -8, -2)}deg`,
          translate: `${motionValue(f, 0, 1.3 * fps, 140, 0)}px ${motionValue(f, 0, 1.3 * fps, 80, 0)}px`,
          scale: motionValue(f, 0, 1.3 * fps, 0.85, 1),
        }}
      >
        <CaseDossier onOpen={inert} />
      </div>
      <Thread
        progress={motionValue(f, 1.2 * fps, 3.2 * fps)}
        clearAreas={[
          { x: 1380, y: 700, width: 420, height: 150 },
          { x: 120, y: 620, width: 1250, height: 350 },
          { x: 880, y: 190, width: 1000, height: 450 },
          { x: 330, y: 480, width: 1270, height: 200 },
        ]}
      />
      <div
        className="film-tile"
        style={{
          left: 160,
          top: 660,
          width: 550,
          opacity: motionValue(f, 2.5 * fps, 3 * fps),
          translate: `0 ${motionValue(f, 2.5 * fps, 3.4 * fps, 45, 0)}px`,
          rotate: `${motionValue(f, 2.5 * fps, 3.4 * fps, 4, 0)}deg`,
        }}
      >
        <EvidenceTile
          code="LT-24"
          title="load-test.md"
          subtitle="Steady state · p95 dispatch latency"
          relation="supports"
        />
      </div>
      <div
        className="film-tile"
        style={{
          left: 780,
          top: 660,
          width: 550,
          opacity: motionValue(f, 3.15 * fps, 3.65 * fps),
          translate: `0 ${motionValue(f, 3.15 * fps, 4 * fps, 45, 0)}px`,
          rotate: `${motionValue(f, 3.15 * fps, 4 * fps, -4, 0)}deg`,
        }}
      >
        <EvidenceTile
          code="IR-08"
          title="incident-review.md"
          subtitle="Burst traffic · p95 dispatch latency"
          relation="contradicts"
        />
      </div>
      <div
        className="film-margin"
        style={{
          left: 1420,
          top: 725,
          opacity: motionValue(f, 4.3 * fps, 4.9 * fps),
        }}
      >
        Same release.
        <br />
        Different conditions.
      </div>
      <div
        className="film-question-pill"
        style={{
          left: 400,
          top: 520,
          width: 1120,
          opacity: motionValue(f, 5.3 * fps, 5.8 * fps),
          translate: `0 ${motionValue(f, 5.3 * fps, 6.1 * fps, 28, 0)}px`,
          scale: motionValue(f, 7.3 * fps, 8 * fps, 1, 1.05),
        }}
      >
        <span>01</span>Why did the burst saturate the queue?<span>↗</span>
      </div>
    </World>
  );
}
