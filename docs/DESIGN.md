# Design and component decisions

Atlas is an investigation desk built around a fictional service release. Its visual language comes from field notes, source ledgers and retained documents: warm paper, olive ink, a rust signal for the burst incident, Instrument Serif headings, Geist body text and IBM Plex Mono identifiers. The mark is an original vector drawing.

The opening dossier compares actual measurements from the included fictional documents. Forty dots represent 4,000 events per second; six represent 600. Switching conditions changes the count, dispatch latency and queue depth together. A shared zero-to-twelve-second scale makes the difference visible without rescaling it. Both conditions lead directly to their original sources or the question that connects them.

## Reference study

Eight selected sites from [Seesaw](https://www.seesaw.website/) were inspected, including actual interactions where useful. This was a representative study, not an exhaustive review of the catalog.

| Reference | Observed mechanism | Atlas application |
| --- | --- | --- |
| [GenCup](https://www.gencup.art/) | A data-derived visual identity rather than interchangeable decoration | Traffic marks and the retrieval assay derive their form from the fixture data |
| [WØRKS](https://works.studio/) | Confident type scale and asymmetric image composition | A compact investigation heading, unequal working columns and a staged case file |
| [Shopify Winter 2026](https://www.shopify.com/editions/winter2026) | Illustrated opening, strong section indexing and a Developer handoff | A consistent collection/chapter index and transitions that retain the investigation context |
| [Linear](https://linear.app/) | Product material carries the opening; restrained navigation | Real sources and controls occupy the primary surface |
| [Bencho](https://bencho.dev/) | Deliberate picker interaction and selected states | One custom selector shared across the five selection paths |
| [Atlas for Mac](https://www.atlasformac.com/) | A considered disclosure flow | Inspection keeps a clear close action and usable reading space |
| [Midday](https://midday.ai/) | Feature navigation and progressive exploration | Four persistent workspace views with keyboard navigation |
| [Interfaces](https://interfaces.dev/) | Interface annotation as part of the composition | Source IDs, line ranges and retained hashes remain visible alongside the evidence |

No reference site's branding, imagery or layout was copied. The earlier Basement, Linear redesign and historical Lusion research below informed the first iteration; the current direction developed from the additional live study and journey review.

[Basement Studio](https://basement.studio/) informed the compact wordmark, restrained chrome and stronger visual staging. Its [services page](https://basement.studio/services) records recognised work. No studio images, 3D assets, code or branding were copied.

[Linear's redesign account](https://linear.app/now/how-we-redesigned-the-linear-ui) informed the separation of global navigation, workspace controls and source inspection. Atlas applies its own horizontal navigation and source panels; it does not replicate Linear's layouts or theme generator.

[Lusion's Webby recognition](https://winners.webbyawards.com/2020/websites/features-design/best-homewelcome-page/111726/lusion) was an additional visual reference. That award concerns a historical site, not an evaluation of Atlas or its current interface. Motion-heavy studio work was considered alongside the practical reading and inspection needs of this product.

## Applied resources

| Resource | Application and adaptation |
| --- | --- |
| [SmoothUI Animated Tabs](https://smoothui.dev/docs/components/animated-tabs) | Copied source adapted into controlled navigation, shared-layout selection movement, arrow/Home/End keys and one four-tab row on small screens |
| [SmoothUI Animated File Upload](https://smoothui.dev/docs/components/animated-file-upload) | Copied drag-and-drop source adapted for one document, 2 MB size validation and the actual import form; invalid UTF-8 replacements clear the previous content |
| [shadcn Command](https://ui.shadcn.com/docs/components/radix/command) | Radix-compatible source connected to real documents, saved answers and actions through cmdk; Ctrl/Command K, keyboard selection and labelled dialogs |
| [Magic UI Blur Fade](https://magicui.design/docs/components/blur-fade) | Copied source used for answer arrival, with a reduced-motion branch |
| [Magic UI Code Comparison](https://magicui.design/docs/components/code-comparison) | Two-pane structure adapted for retained source versions. React text nodes replace highlighting HTML; source lines, hashes, independent line numbers and preview limits are explicit |
| [React Flow](https://reactflow.dev/learn) | Interactive document and evidence maps from actual API data, custom nodes, relationship labels, drag/zoom controls and a complete list alternative |
| [Motion](https://motion.dev/docs/react) | Shared-layout tab movement, upload interactions and answer transitions; one animation engine and reduced-motion support |
| [Lucide](https://lucide.dev/guide/packages/lucide-react) | Consistent navigation and action icons, with text or accessible names for actionable controls |
| [Radix Select](https://www.radix-ui.com/primitives/docs/components/select) | Custom animated popups for answer mode, ranking limit, source version, comparison version and evidence relationship; full-row highlights, descriptions, typeahead and focus restoration |
| [Geist](https://fontsource.org/fonts/geist), [Instrument Serif](https://fontsource.org/fonts/instrument-serif), [IBM Plex Mono](https://fontsource.org/fonts/ibm-plex-mono) | Self-hosted text, display and identifier fonts with no runtime font-service request |
| [Tailwind](https://tailwindcss.com/docs/detecting-classes-in-source-files) | Registry utility styles combined with project-specific CSS. Explicit source globs keep component styling working when the enclosing workspace is Git-ignored |

The copied registry components are maintained locally; upstream changes are not applied automatically. Their notices are retained in [THIRD-PARTY.md](../THIRD-PARTY.md).

## Journey and states

The initial investigation pairs three actual demo questions with the interactive release dossier. A completed answer keeps the form available, gives every citation an inspector action, and updates the source map with the retrieved passages. A cancelled or failed request leaves a usable form. An answer with no matching passages does not pretend to have citations.

The source library includes filtering and a clear-filter recovery action. Inspection opens an exact version, keeps earlier text available and restores focus on close. Version comparison loads another stored version separately, rejects late aborted completions, renders content as text, and labels the 240-line preview limit. A bounded line comparison highlights changed rows while keeping matching lines aligned across insertions. The two panes keep their own line numbers and hashes.

Cards display supporting and contradictory relationships with labels as well as colour. Their source buttons open the recorded chunk version. The editor gives every source its own relationship row. Evaluation includes an interactive twelve-question assay: each expected source has a found or missing mark, and selecting a question opens its saved results. The full receipt table exposes the expected names, returned passages and original corpus identity.

Small screens use readable source lists by default. The optional map labels its eight-source limit and provides every source through the list. Page scrolling over the map does not zoom it. Main navigation remains keyboard-operable, search keeps an accessible name when its text is hidden, and dialogs retain visible focus and Escape behavior.

## Considered alternatives

React Bits text effects, Magic UI beams and background effects, and GSAP/Anime timelines were evaluated as possible visual treatments. The current source graph uses React Flow for actual node interaction, while Motion owns the component transitions. Animated decoration and a second interaction engine would not add another source-inspection capability.

Assistant-style thread components were considered for streaming conversation. Atlas currently uses completed, source-linked answer receipts rather than a streaming chat runtime. Excalidraw remains a possible fit for a future freeform annotation editor; the current graph records typed evidence links.

## Performance and review

React Flow and the search palette are loaded separately with labelled loading states. The current production build has a 301.83 kB main module, 218.76 kB React runtime, 183.25 kB map and 17.09 kB search module before compression. These are build observations, not a browser speed score. The map's positions are temporary and reset when its underlying data changes. Its zoom controls and complete list alternative remain available when the fitted labels are small.

Desktop and narrow-screen browser checks complement twelve interface tests. Observer stubs in jsdom support the tests but do not measure layout, animation or screen-reader behavior. Journey review corrected mobile brand wrapping, two-row navigation, excessive reader spacing, inconsistent upload size labels and inline relationship controls. No external usability study or formal accessibility conformance is claimed.

The [component film](MOTION.md) shares the application's citation, source, version, metric and retrieval-assay components. Its frame clock controls their motion; browser screenshots are not film material.
