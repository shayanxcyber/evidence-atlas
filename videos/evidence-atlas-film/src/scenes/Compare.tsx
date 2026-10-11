import { useCurrentFrame, useVideoConfig } from "remotion";
import { VersionPane } from "../../../../web/src/components/version-comparison";
import fixture from "../fixtures.json";
import { World, Thread, motionValue } from "../world";
export function Compare() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inspection =
    motionValue(f, 4.5 * fps, 5.5 * fps, 1, 1.13) -
    motionValue(f, 6.8 * fps, 7.8 * fps, 0, 0.13);
  return (
    <World chapter="03 / TEXT CHANGES. EVIDENCE STAYS.">
      <div
        className="film-headline"
        style={{
          left: 135,
          top: 145,
          translate: `0 ${motionValue(f, 0, 0.6 * fps, 25, 0)}px`,
        }}
      >
        <span className="film-eyebrow">There’s a before. Keep it.</span>
        <h1>
          An earlier threshold.
          <br />
          <em>Still in the record.</em>
        </h1>
      </div>
      <Thread
        path="M 170 850 C 480 1040 650 460 980 590 S 1530 1060 1750 825"
        progress={motionValue(f, 0, 2 * fps)}
        clearAreas={[
          { x: 25, y: 395, width: 1870, height: 415 },
          { x: 160, y: 815, width: 1600, height: 145 },
          { x: 110, y: 950, width: 1300, height: 65 },
        ]}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          scale: inspection,
          transformOrigin: "960px 670px",
        }}
      >
        <div
          className="film-versions comparison-panes"
          style={{ left: 135, top: 450, width: 1650, gap: 50 }}
        >
          <div
            style={{
              opacity: motionValue(f, 0.5 * fps, 1 * fps),
              translate: `${motionValue(f, 0.5 * fps, 1.4 * fps, -80, 0)}px 0`,
              rotate: `${motionValue(f, 0.5 * fps, 1.4 * fps, -3, 0)}deg`,
            }}
          >
            <VersionPane
              source={fixture.versions[0]}
              comparison={fixture.versions[1]}
              label="Cited earlier version"
            />
          </div>
          <div
            style={{
              opacity: motionValue(f, 1.3 * fps, 1.8 * fps),
              translate: `${motionValue(f, 1.3 * fps, 2.2 * fps, 100, 0)}px 0`,
              rotate: `${motionValue(f, 1.3 * fps, 2.2 * fps, 3, 0)}deg`,
            }}
          >
            <VersionPane
              source={fixture.versions[1]}
              comparison={fixture.versions[0]}
              label="Current version"
            />
          </div>
        </div>
        <div
          className="film-version-callout"
          style={{
            left: 280,
            top: 845,
            opacity: motionValue(f, 2.5 * fps, 3 * fps),
          }}
        >
          <strong>10,000</strong>
          <span>events · earlier threshold</span>
        </div>
        <div
          className="film-version-callout"
          style={{
            left: 1140,
            top: 845,
            opacity: motionValue(f, 3.2 * fps, 3.7 * fps),
          }}
        >
          <strong>8,000</strong>
          <span>events · revised threshold</span>
        </div>
        <div
          className="film-version-arrow"
          style={{
            left: 885,
            top: 850,
            opacity: motionValue(f, 3 * fps, 3.5 * fps),
            scale: motionValue(f, 3 * fps, 3.7 * fps, 0.5, 1),
          }}
        >
          →
        </div>
      </div>
      <div
        className="film-annotation"
        style={{
          left: 135,
          top: 965,
          opacity: motionValue(f, 4.5 * fps, 5 * fps),
        }}
      >
        Two versions. Two hashes. The earlier citation still opens.
      </div>
    </World>
  );
}
