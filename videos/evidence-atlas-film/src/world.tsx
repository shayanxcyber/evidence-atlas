import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, interpolate, staticFile } from "remotion";
import { useId, type ReactNode } from "react";
import "../../../web/src/components/evidence-document.css";
import "./film.css";
void loadFont({
  family: "Geist",
  url: staticFile("fonts/Geist.woff2"),
  weight: "400",
});
void loadFont({
  family: "Instrument Serif",
  url: staticFile("fonts/InstrumentSerif.woff2"),
  weight: "400",
});
void loadFont({
  family: "IBM Plex Mono",
  url: staticFile("fonts/PlexMono.woff2"),
  weight: "400",
});
export const motionValue = (
  frame: number,
  start: number,
  end: number,
  a = 0,
  b = 1,
) =>
  interpolate(frame, [start, end], [a, b], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
export const inert = () => {};
export function World({
  children,
  chapter,
}: {
  children: ReactNode;
  chapter: string;
}) {
  return (
    <AbsoluteFill className="film">
      <div className="film-grain" />
      <div className="film-running-head">
        <span>Evidence Atlas</span>
        <span>{chapter}</span>
      </div>
      {children}
      <div className="film-foot">
        <span>ASTER RELAY / FICTIONAL ENGINEERING COLLECTION</span>
        <span>ASK → TRACE → COMPARE → DECIDE</span>
      </div>
    </AbsoluteFill>
  );
}
export function Thread({
  progress = 1,
  path = "M 170 880 C 170 630 320 790 540 730 S 930 590 1130 730 S 1530 880 1750 590",
  clearAreas = [],
}: {
  progress?: number;
  path?: string;
  clearAreas?: { x: number; y: number; width: number; height: number }[];
}) {
  const maskId = `thread-${useId().replaceAll(":", "")}`;
  return (
    <svg className="film-thread" viewBox="0 0 1920 1080" aria-hidden="true">
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1920"
          height="1080"
        >
          <rect width="1920" height="1080" fill="white" />
          {[
            { x: 100, y: 50, width: 1730, height: 80 },
            { x: 100, y: 120, width: 1730, height: 320 },
            { x: 100, y: 1010, width: 1730, height: 60 },
            ...clearAreas,
          ].map((area, index) => (
            <rect key={index} {...area} fill="black" rx="12" />
          ))}
        </mask>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="#9baa7a"
        strokeWidth="2"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - progress}
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}
