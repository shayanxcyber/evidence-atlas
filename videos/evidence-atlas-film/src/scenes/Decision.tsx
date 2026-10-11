import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  Metric,
  EvidenceTile,
} from "../../../../web/src/components/evidence-document";
import { RetrievalAssay } from "../../../../web/src/components/retrieval-assay";
import fixture from "../fixtures.json";
import { AtlasMark } from "../../../../web/src/components/atlas-mark";
import { World, Thread, motionValue } from "../world";
export function Decision() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <World chapter="04 / MEASURE. INSPECT. DECIDE.">
      <Thread
        progress={motionValue(f, 0, 1.6 * fps)}
        path="M 170 880 C 340 970 620 890 880 910 S 1430 990 1750 830"
        clearAreas={[
          { x: 110, y: 355, width: 1700, height: 355 },
          { x: 110, y: 625, width: 1680, height: 245 },
          { x: 110, y: 830, width: 1400, height: 110 },
        ]}
      />
      <div
        className="film-finish"
        style={{
          opacity: motionValue(f, 4.8 * fps, 5.5 * fps, 0, 1),
          scale: motionValue(f, 4.8 * fps, 5.7 * fps, 0.86, 1),
        }}
      >
        <AtlasMark />
        <h1>Evidence Atlas</h1>
        <p>Follow the source. Keep the context.</p>
      </div>
      <div
        style={{
          opacity: motionValue(f, 4.6 * fps, 5.15 * fps, 1, 0),
          translate: `0 ${motionValue(f, 4.6 * fps, 5.3 * fps, 0, -55)}px`,
        }}
      >
        <div className="film-headline" style={{ left: 135, top: 135 }}>
          <span className="film-eyebrow">The misses matter, too.</span>
          <h1>
            Measure the search.
            <br />
            <em>Inspect the gaps.</em>
          </h1>
        </div>
        <div
          className="film-metrics metrics"
          style={{
            left: 135,
            top: 410,
            width: 1000,
            opacity: motionValue(f, 0.15 * fps, 0.7 * fps),
          }}
        >
          <Metric
            value="95.8%"
            label="Recall @ 3"
            detail="12 fictional questions"
          />
          <Metric
            value="0.944"
            label="Mean reciprocal rank"
            detail="Pinned source versions"
          />
        </div>
        <div
          className="film-tile"
          style={{
            left: 1220,
            top: 410,
            width: 540,
            opacity: motionValue(f, 0.7 * fps, 1.1 * fps),
            translate: `0 ${motionValue(f, 0.7 * fps, 1.4 * fps, 35, 0)}px`,
          }}
        >
          <EvidenceTile
            code="Q11"
            title="A useful miss"
            subtitle="One of two expected sources retrieved"
            relation="context"
          />
        </div>
        <div
          className="film-assay"
          style={{ position: "absolute", left: 135, top: 700, width: 1630 }}
        >
          <RetrievalAssay
            cases={fixture.evaluation.cases}
            progress={motionValue(f, 0.4 * fps, 1.9 * fps)}
          />
        </div>
        <div className="film-annotation" style={{ left: 135, top: 900 }}>
          A complete trail is more useful than a perfect-looking number.
        </div>
      </div>
    </World>
  );
}
