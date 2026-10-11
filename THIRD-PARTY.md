# Third-party notices

Registry source was retrieved on **12 October 2026** and customized for Atlas. The backend, fictional engineering fixtures, evaluation cases, application integration, custom mark and stylesheet are authored for this project.

| Source | Local files | Notice |
| --- | --- | --- |
| SmoothUI, educlopez/smoothui | `animated-tabs.tsx`, `file-upload.tsx` | [MIT notice](third-party/smoothui-license.txt) |
| shadcn/ui | `components/ui/command.tsx`, `components/ui/dialog.tsx` | [MIT notice](third-party/shadcn-MIT.txt) |
| Magic UI | `blur-fade.tsx`, adapted two-pane comparison structure | [MIT notice](third-party/magicui-license.txt) |
| Geist font | Fontsource package used in the web build and local film font | [OFL notice](third-party/geist-OFL.txt) |
| Instrument Serif font | Fontsource package used in the web build and local film font | [OFL notice](third-party/instrument-serif-OFL.txt) |
| IBM Plex Mono font | Fontsource package used in the web build | [OFL notice](third-party/ibm-plex-mono-OFL.txt) |

React, React DOM, React Flow, Motion, cmdk, Radix, Lucide, Tailwind and build dependencies retain their package notices. The exact installed dependency versions are recorded in `web/package-lock.json` and `uv.lock`.

Registry endpoints:

- https://smoothui.dev/r/animated-tabs.json
- https://smoothui.dev/r/animated-file-upload.json
- https://ui.shadcn.com/r/styles/new-york/command.json
- https://ui.shadcn.com/r/styles/new-york/dialog.json
- https://magicui.design/r/blur-fade.json
- https://magicui.design/r/code-comparison.json

The comparison adaptation keeps source text in React text nodes and does not use the upstream HTML highlighting fallback or its theme/highlighter dependencies. Font files are bundled by the build; no studio assets or third-party customer claims appear in the demo.

The current editable component film uses Remotion 4.0.534, matching runtime packages and shared application React components. Its choreography, fictional source props and procedural stereo score are authored for Evidence Atlas. Film fonts use the notices above. Runtime package notices remain in their packages and the exact versions are in the film lockfile.

The procedural score can be rebuilt with the standard-library script at `videos/evidence-atlas-film/scripts/compose-score.py`.
