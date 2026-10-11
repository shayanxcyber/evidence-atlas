import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { Audio } from "@remotion/media";
import {
  Composition,
  Folder,
  Easing,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Question } from "./scenes/Question";
import { Trace } from "./scenes/Trace";
import { Compare } from "./scenes/Compare";
import { Decision } from "./scenes/Decision";
export function EvidenceAtlasFilm() {
  const { fps } = useVideoConfig();
  const timing = linearTiming({
    durationInFrames: fps,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  return (
    <>
      <Audio
        src={staticFile("audio/atlas-score.wav")}
        volume={0.8}
        premountFor={fps}
      />
      <TransitionSeries>
        <TransitionSeries.Sequence
          name="Question becomes a trail"
          durationInFrames={8 * fps}
          premountFor={fps}
        >
          <Question />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={timing}
        />
        <TransitionSeries.Sequence
          name="Citation becomes original lines"
          durationInFrames={10 * fps}
          premountFor={fps}
        >
          <Trace />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={timing}
        />
        <TransitionSeries.Sequence
          name="Retained revisions"
          durationInFrames={9 * fps}
          premountFor={fps}
        >
          <Compare />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={timing}
        />
        <TransitionSeries.Sequence
          name="Measured retrieval and identity"
          durationInFrames={8 * fps}
          premountFor={fps}
        >
          <Decision />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
}
export function MyComposition() {
  return (
    <>
      <Composition
        id="EvidenceAtlas"
        component={EvidenceAtlasFilm}
        durationInFrames={1920}
        fps={60}
        width={1920}
        height={1080}
      />
      <Folder name="Scenes">
        <Composition
          id="Question"
          component={Question}
          durationInFrames={480}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Trace"
          component={Trace}
          durationInFrames={600}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Compare"
          component={Compare}
          durationInFrames={540}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Decision"
          component={Decision}
          durationInFrames={480}
          fps={60}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
}
