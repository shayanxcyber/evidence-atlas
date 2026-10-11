# Evidence Atlas — Follow the source

An editable 32-second component film about the investigation, its retained sources and the retrieval gaps. It renders application React components directly rather than embedding screenshots.

[![Preview the component film](../../docs/media/evidence-atlas-preview.gif)](../../docs/media/evidence-atlas.mp4)

[Watch the full 1080p / 60 fps film](../../docs/media/evidence-atlas.mp4). Demonstration props are fictional; this is an authored component sequence rather than a recording of a live request.

## Local preview

From the Evidence Atlas project root:

```sh
cd web
npm ci
cd ../videos/evidence-atlas-film
npm ci
npm run dev
```

Open the reported Studio URL and select `EvidenceAtlas`. The four scene compositions are also available independently. Studio defaults to port 3020 and leaves browser opening to the caller.

## Source and format

- `src/Composition.tsx`: connected sequence, one-second handoffs and local score.
- `src/scenes/`: question, citation, comparison and retrieval passages.
- `src/fixtures.json`: authored fictional source/evaluation props.
- `src/world.tsx`: local fonts, shared thread and frame-based easing.
- `public/`: local font files and the procedural stereo score.
- `scripts/compose-score.py`: standard-library generator for that score; run it with Python to rebuild the WAV.

The composition is 1920 × 1080, 60 fps, frames 0–1919. It imports components from `../../web/src`; keep it inside this checkout with the web dependencies installed. All Remotion packages use the same version.

## Checks and review

```sh
npm run lint
```

ESLint/TypeScript and bundling pass from the selected source checkout. Forty-eight revised image samples cover the timeline and repaired visual defects, with denser coverage of the citation entrance. Studio playback advances through the closing scene and automatic stop; direct seeks also work. The complete encoded file decodes without reported errors. Heard audio review remains outstanding. See [motion notes](../../docs/MOTION.md) for the sequence, actual review and limitations, and [third-party notices](../../THIRD-PARTY.md) for source/font credits.

## Rebuild the film

From this directory, after the web and film dependencies are installed:

```sh
python scripts/compose-score.py
npx remotion render EvidenceAtlas out/evidence-atlas.mp4 --codec=h264 --crf=18 --audio-codec=aac --audio-bitrate=192k --overwrite=false
```

The checked-in delivery is H.264 video with stereo AAC at 48 kHz. The score generator reproduces the included WAV byte for byte. Preview GIF playback is silent and reduced to 960 × 540 at 10 fps; use the MP4 for the complete frame rate and sound.
