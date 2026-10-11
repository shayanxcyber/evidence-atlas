import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { MotionConfig, motion } from "motion/react";
import AnimatedTabs from "./components/animated-tabs";
import AnimatedFileUpload from "./components/file-upload";
import { BlurFade } from "./components/blur-fade";
import { InvestigationBrief } from "./components/investigation-brief";
import { AtlasMark } from "./components/atlas-mark";
import { AtlasSelect } from "./components/atlas-select";
import { RetrievalAssay } from "./components/retrieval-assay";
import {
  AnswerText,
  SourceLines,
  Metric,
} from "./components/evidence-document";
import { VersionComparison } from "./components/version-comparison";

import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  FlaskConical,
  FolderOpen,
  GitBranch,
  Layers3,
  Link2,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  Square,
  Upload,
  X,
} from "lucide-react";
import { api, download, name, percent } from "./api";
import type {
  Answer,
  Card,
  Evaluation,
  Passage,
  Source,
  SourceDetail,
  Status,
} from "./api";

type View = "workbench" | "sources" | "cards" | "evaluations";
const WorkspaceSearch = lazy(() => import("./components/workspace-search"));
const EvidenceGraph = lazy(() => import("./components/evidence-graph"));
function GraphFallback() {
  return (
    <div className="evidence-canvas graph-loading" role="status">
      <LoaderCircle className="spin" size={20} />
      Opening the source map…
    </div>
  );
}
const prompts = [
  "Why did the burst saturate the queue?",
  "When should the operator pause rollout?",
  "Where are worker access tokens stored?",
];

export function App() {
  const [view, setView] = useState<View>("workbench");
  const [commandOpen, setCommandOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("");
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((previous) => !previous);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const [sources, setSources] = useState<Source[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [history, setHistory] = useState<Answer[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState("evidence");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [pending, setPending] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [source, setSource] = useState<SourceDetail | null>(null);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [compareVersions, setCompareVersions] = useState(false);
  const [highlight, setHighlight] = useState<Passage | null>(null);
  const [k, setK] = useState(3);
  const [evaluating, setEvaluating] = useState(false);
  const [selectedRun, setSelectedRun] = useState<Evaluation | null>(null);
  const answerRequest = useRef<AbortController | null>(null);
  const sourceRequest = useRef<AbortController | null>(null);
  const sourceSession = useRef(false);
  const sourceReturnFocus = useRef<HTMLElement | null>(null);
  const searchButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  async function refresh() {
    const [docs, evidence, runs, info, answers] = await Promise.all([
      api<Source[]>("/documents"),
      api<Card[]>("/cards"),
      api<Evaluation[]>("/evaluations"),
      api<Status>("/status"),
      api<Answer[]>("/answers"),
    ]);
    setSources(docs);
    setCards(evidence);
    setEvaluations(runs);
    setStatus(info);
    setHistory(answers);
  }
  useEffect(() => {
    let live = true;
    refresh()
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
      answerRequest.current?.abort();
      sourceRequest.current?.abort();
    };
  }, []);

  async function ask(event?: FormEvent, prompt?: string) {
    event?.preventDefault();
    const value = (prompt ?? question).trim();
    if (!value) return;
    setQuestion(value);
    setView("workbench");
    setError("");
    setNotice("");
    setAnswer(null);
    setPending(true);
    answerRequest.current?.abort();
    const controller = new AbortController();
    answerRequest.current = controller;
    try {
      const result = await api<Answer>("/answers", {
        method: "POST",
        body: JSON.stringify({ question: value, mode }),
        signal: controller.signal,
      });
      if (answerRequest.current === controller) {
        setAnswer(result);
        if (result.id)
          setHistory((previous) => [result, ...previous].slice(0, 20));
      }
    } catch (e) {
      if (answerRequest.current === controller && !controller.signal.aborted)
        setError((e as Error).message);
    } finally {
      if (answerRequest.current === controller) {
        setPending(false);
        answerRequest.current = null;
      }
    }
  }

  function cancel() {
    answerRequest.current?.abort();
    answerRequest.current = null;
    setPending(false);
    setNotice("Request cancelled.");
  }

  const openSource = useCallback(
    async (documentId: string, version?: string, passage?: Passage) => {
      if (!sourceSession.current) {
        sourceReturnFocus.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        sourceSession.current = true;
      }
      sourceRequest.current?.abort();
      const controller = new AbortController();
      sourceRequest.current = controller;
      setSourceOpen(true);
      setSourceBusy(true);
      setCompareVersions(false);
      setSource(null);
      setHighlight(passage ?? null);
      try {
        const doc = await api<SourceDetail>(
          `/documents/${documentId}${version ? "?version=" + encodeURIComponent(version) : ""}`,
          { signal: controller.signal },
        );
        if (sourceRequest.current === controller) setSource(doc);
      } catch (e) {
        if (!controller.signal.aborted && sourceRequest.current === controller)
          setError((e as Error).message);
      } finally {
        if (sourceRequest.current === controller) setSourceBusy(false);
      }
    },
    [],
  );

  async function evaluate() {
    setEvaluating(true);
    setError("");
    try {
      const run = await api<Evaluation>(`/evaluations?k=${k}`, {
        method: "POST",
      });
      setEvaluations((previous) => [run, ...previous]);
      setSelectedRun(run);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEvaluating(false);
    }
  }

  const activeRun = selectedRun ?? evaluations[0];
  const page = {
    workbench: "Answer workbench",
    sources: "Source library",
    cards: "Evidence cards",
    evaluations: "Retrieval evaluation",
  }[view];
  return (
    <MotionConfig reducedMotion="user">
      <div className="shell">
        <a className="skip" href="#workspace">
          Skip to workspace
        </a>
        <header className="global-header">
          <a
            className="brand"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              setView("workbench");
            }}
          >
            <AtlasMark />
            <span>
              Evidence <span>Atlas</span>
            </span>
          </a>
          <span className="header-divider" />
          <div className="workspace-identity">
            <span className="signal-dot" />
            Aster Relay <small>Fictional demo</small>
          </div>
          <div className="header-actions">
            <button
              className="global-search"
              aria-label="Search anything"
              ref={searchButton}
              onClick={() => setCommandOpen(true)}
            >
              <Search size={15} />
              <span>Search anything</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              className="button compact"
              aria-label="Import source"
              onClick={() => setImportOpen(true)}
            >
              <Plus size={15} />
              <span>Import source</span>
            </button>
          </div>
        </header>
        <div className="workspace-navigation">
          <AnimatedTabs
            variant="pill"
            className="workspace-tabs"
            activeTab={view}
            onChange={(value) => {
              setView(value as View);
              setNotice("");
            }}
            tabs={[
              {
                id: "workbench",
                label: "Investigate",
                icon: <Search size={15} />,
              },
              {
                id: "sources",
                label: "Sources",
                icon: <FolderOpen size={15} />,
              },
              {
                id: "cards",
                label: "Evidence",
                icon: <GitBranch size={15} />,
              },
              {
                id: "evaluations",
                label: "Evaluate",
                icon: <FlaskConical size={15} />,
              },
            ]}
          />
          <span className="workspace-meta">
            {sources.length} DOCUMENTS <span>/</span>{" "}
            {sources.reduce((sum, doc) => sum + doc.chunks, 0)} PASSAGES
          </span>
        </div>
        <div className="main">
          <main id="workspace" tabIndex={-1} role="tabpanel" aria-label={page}>
            {loading && (
              <div className="banner" role="status">
                <LoaderCircle className="spin" size={16} />
                Opening the collection…
              </div>
            )}
            {error && (
              <div className="banner error" role="alert">
                {error}
                <button aria-label="Dismiss error" onClick={() => setError("")}>
                  <X size={16} />
                </button>
              </div>
            )}
            {notice && (
              <div className="banner" role="status">
                <Check size={16} />
                {notice}
              </div>
            )}
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === "workbench" && (
                <>
                  <div
                    className={
                      "workbench-heading " + (answer ? "has-answer" : "")
                    }
                  >
                    <div>
                      <div className="heading-kicker">
                        <span className="signal-dot" /> Investigation desk{" "}
                        <span>Collection 01</span>
                      </div>
                      <h1>
                        {answer ? "The source trail." : "The rollout dossier."}
                      </h1>
                    </div>
                    <div className="heading-context">
                      <span>ASK / TRACE / COMPARE / DECIDE</span>
                      <p>
                        Original documents. Retained versions.
                        <br />A conclusion with its context attached.
                      </p>
                    </div>
                  </div>
                  <div className="workbench-grid">
                    <section
                      className="answer-column"
                      aria-label="Question and answer"
                    >
                      <form className="question-box" onSubmit={ask}>
                        <label htmlFor="question">
                          <Search size={17} />
                          Ask the collection
                        </label>
                        <textarea
                          id="question"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder="What needs to happen before the full rollout?"
                          maxLength={1000}
                          rows={3}
                        />
                        <div className="question-footer">
                          <label className="mode-label">
                            Answer mode
                            <AtlasSelect
                              label="Answer mode"
                              value={mode}
                              onChange={setMode}
                              options={[
                                {
                                  value: "evidence",
                                  label: "Source excerpts",
                                  description:
                                    "Read original passages with exact citations",
                                },
                                {
                                  value: "model",
                                  label: "Connected model",
                                  description: status?.model_ready
                                    ? "Compose from retrieved passages"
                                    : "Configure a provider on the server to enable",
                                  disabled: !status?.model_ready,
                                },
                              ]}
                            />
                          </label>
                          {pending ? (
                            <button
                              className="button secondary"
                              type="button"
                              onClick={cancel}
                            >
                              <Square size={14} />
                              Cancel
                            </button>
                          ) : (
                            <button
                              className="button"
                              disabled={!question.trim() || loading}
                              type="submit"
                            >
                              Find evidence
                              <ArrowRight size={16} />
                            </button>
                          )}
                        </div>
                      </form>
                      {!answer && (
                        <div className="suggestions">
                          <span>Try a question from this collection</span>
                          {prompts.map((prompt, index) => (
                            <button
                              key={prompt}
                              onClick={() => void ask(undefined, prompt)}
                            >
                              <span aria-hidden="true">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <strong>{prompt}</strong>
                              <ArrowUpRight size={16} />
                            </button>
                          ))}
                        </div>
                      )}
                      {pending && (
                        <div className="answer-loading" role="status">
                          <LoaderCircle className="spin" size={20} />
                          <strong>Following the source trail…</strong>
                          <span>Searching the current document versions.</span>
                        </div>
                      )}
                      {answer && (
                        <BlurFade
                          key={answer.id ?? answer.answer}
                          blur="2px"
                          duration={0.3}
                        >
                          <article className="answer-card">
                            <div className="section-title">
                              <span>
                                <span className="live-dot" />
                                {answer.status === "no_evidence"
                                  ? "No matching evidence"
                                  : answer.mode === "model"
                                    ? "Connected answer"
                                    : "Evidence answer"}
                              </span>
                              {answer.id && (
                                <button
                                  className="icon-button"
                                  title="Export answer receipt"
                                  onClick={() =>
                                    download(answer, "atlas-answer.json")
                                  }
                                >
                                  <ArrowDownToLine size={17} />
                                  <span className="sr-only">
                                    Export answer receipt
                                  </span>
                                </button>
                              )}
                            </div>
                            <AnswerText
                              answer={answer}
                              onOpen={(cite) =>
                                void openSource(
                                  cite.document_id,
                                  cite.version_id,
                                  cite,
                                )
                              }
                            />
                            {answer.citations.length > 0 && (
                              <div className="answer-foot">
                                <span>
                                  <ShieldCheck size={14} />
                                  {answer.citation_check}
                                </span>
                                <button
                                  className="text-button"
                                  onClick={() => setCardOpen(true)}
                                >
                                  <Plus size={14} />
                                  Save evidence card
                                </button>
                              </div>
                            )}
                          </article>
                        </BlurFade>
                      )}
                      {!answer && !pending && (
                        <div className="workbench-note">
                          <Link2 size={16} />
                          <p>
                            Each result opens the exact document version and
                            original lines. Contradictions stay visible.
                          </p>
                        </div>
                      )}
                      {answer?.citations.length ? (
                        <section className="retrieved">
                          <div className="list-heading">
                            <h2>
                              Retrieved sources{" "}
                              <small>{answer.citations.length}</small>
                            </h2>
                            <span>One passage per document</span>
                          </div>
                          {answer.citations.map((hit) => (
                            <button
                              className="passage"
                              key={hit.id}
                              onClick={() =>
                                void openSource(
                                  hit.document_id,
                                  hit.version_id,
                                  hit,
                                )
                              }
                            >
                              <span className="source-label">{hit.label}</span>
                              <div>
                                <h3>{name(hit.title)}</h3>
                                <p>
                                  {hit.body
                                    .replace(/^#+\s/gm, "")
                                    .slice(0, 180)}
                                  …
                                </p>
                                <small>
                                  Lines {hit.start_line}–{hit.end_line}
                                  <span>·</span>Version {hit.sha256.slice(0, 8)}
                                </small>
                              </div>
                              <ArrowUpRight size={16} />
                            </button>
                          ))}
                        </section>
                      ) : null}
                    </section>
                    <aside className="map-column">
                      {answer ||
                      !sources.some(
                        (doc) => doc.title === "incident-review.md",
                      ) ||
                      !sources.some((doc) => doc.title === "load-test.md") ? (
                        <Suspense fallback={<GraphFallback />}>
                          <EvidenceGraph
                            sources={sources}
                            passages={answer?.citations}
                            busy={pending}
                            onOpen={openSource}
                          />
                        </Suspense>
                      ) : (
                        <InvestigationBrief
                          sources={sources}
                          onOpen={openSource}
                          onInvestigate={() => void ask(undefined, prompts[0])}
                        />
                      )}
                    </aside>
                  </div>
                  {!answer &&
                    sources.some(
                      (doc) => doc.title === "incident-review.md",
                    ) && (
                      <section className="collection-map">
                        <div className="collection-map-heading">
                          <span>THE COLLECTION</span>
                          <h2>Every thread starts somewhere.</h2>
                          <p>Open a document. Follow its original lines.</p>
                        </div>
                        <Suspense fallback={<GraphFallback />}>
                          <EvidenceGraph
                            sources={sources}

                            busy={pending}
                            onOpen={openSource}
                          />
                        </Suspense>
                      </section>
                    )}
                </>
              )}
              {view === "sources" && (
                <>
                  <div className="page-heading small">
                    <div>
                      <span className="eyebrow ink">YOUR COLLECTION</span>
                      <h1>
                        Source library
                        <span className="heading-count">{sources.length}</span>
                      </h1>
                      <p>
                        Original text, exact line locators, and a history of
                        every imported version.
                      </p>
                    </div>
                    <button
                      className="button"
                      onClick={() => setImportOpen(true)}
                    >
                      <Upload size={16} />
                      Import a document
                    </button>
                  </div>
                  <div className="library-filter">
                    <Search size={16} />
                    <input
                      aria-label="Filter source library"
                      value={sourceFilter}
                      onChange={(event) => setSourceFilter(event.target.value)}
                      placeholder="Filter documents…"
                    />
                    <span>
                      {
                        sources.filter((doc) =>
                          doc.title
                            .toLowerCase()
                            .includes(sourceFilter.toLowerCase()),
                        ).length
                      }{" "}
                      DOCUMENTS
                    </span>
                  </div>
                  <div className="library-table">
                    <div className="table-heading">
                      <span>DOCUMENT</span>
                      <span>PASSAGES</span>
                      <span>VERSIONS</span>
                      <span>CONTENT HASH</span>
                    </div>
                    {sources
                      .filter((doc) =>
                        doc.title
                          .toLowerCase()
                          .includes(sourceFilter.toLowerCase()),
                      )
                      .map((doc) => (
                        <button
                          className="library-row"
                          key={doc.id}
                          onClick={() => void openSource(doc.id)}
                        >
                          <span>
                            <span className="file-icon">
                              <FileText size={20} />
                            </span>
                            <span>
                              <strong>{name(doc.title)}</strong>
                              <small>
                                {doc.title} · {doc.characters.toLocaleString()}{" "}
                                characters
                              </small>
                            </span>
                          </span>
                          <span>{doc.chunks}</span>
                          <span>
                            {doc.versions}
                            <small> retained</small>
                          </span>
                          <code>
                            {doc.sha256.slice(0, 12)}
                            <ArrowUpRight size={15} />
                          </code>
                        </button>
                      ))}
                    {!sources.length && !loading && (
                      <div className="empty">
                        Import your first Markdown or text document.
                      </div>
                    )}
                    {!!sources.length &&
                      !sources.some((doc) =>
                        doc.title
                          .toLowerCase()
                          .includes(sourceFilter.toLowerCase()),
                      ) && (
                        <div className="empty">
                          <p>No documents match “{sourceFilter}”.</p>
                          <button
                            className="button secondary"
                            onClick={() => setSourceFilter("")}
                          >
                            Clear filter
                          </button>
                        </div>
                      )}
                  </div>
                  <div className="info-strip">
                    <ShieldCheck size={18} />
                    <p>
                      Importing a changed document keeps the earlier version.
                      Saved citations still open the source they originally
                      referenced.
                    </p>
                  </div>
                </>
              )}
              {view === "cards" && (
                <>
                  <div className="page-heading small">
                    <div>
                      <span className="eyebrow ink">MAKE THE CONNECTION</span>
                      <h1>Evidence cards</h1>
                      <p>
                        Keep a conclusion, its supporting sources, and its
                        contradictions in one place.
                      </p>
                    </div>
                  </div>
                  {cards.map((card) => (
                    <article className="evidence-card" key={card.id}>
                      <div className="evidence-heading">
                        <span className="eyebrow ink">
                          AUTHORED EVIDENCE LINKS
                        </span>
                        <span
                          className={
                            "badge " +
                            (card.links.some(
                              (l) => l.relation === "contradicts",
                            )
                              ? "amber"
                              : "")
                          }
                        >
                          {card.links.some((l) => l.relation === "contradicts")
                            ? "Conflicting evidence"
                            : "Source linked"}
                        </span>
                      </div>
                      <h2>{card.title}</h2>
                      <p>{card.note}</p>
                      <Suspense fallback={<GraphFallback />}>
                        <EvidenceGraph
                          sources={sources}
                          passages={card.links}
                          claim={card.title}
                          onOpen={openSource}
                        />
                      </Suspense>
                      <div className="evidence-link-list">
                        {card.links.map((link, index) => (
                          <button
                            key={link.id + index}
                            className={"evidence-link " + link.relation}
                            onClick={() =>
                              void openSource(
                                link.document_id,
                                link.version_id,
                                link,
                              )
                            }
                          >
                            <FileText size={16} />
                            <strong>{name(link.title)}</strong>
                            <span>
                              {link.relation}
                              {!link.is_current ? " · earlier version" : ""}
                            </span>
                            <ArrowUpRight size={15} />
                          </button>
                        ))}
                      </div>
                      <div className="card-foot">
                        <CircleHelp size={15} />
                        Relationships are saved by the author. They are not
                        inferred by the search engine.
                      </div>
                    </article>
                  ))}
                  {!cards.length && (
                    <div className="empty">
                      Find evidence in the workbench, then save a card.
                    </div>
                  )}
                </>
              )}
              {view === "evaluations" && (
                <>
                  <div className="page-heading small">
                    <div>
                      <span className="eyebrow ink">MEASURE, THEN INSPECT</span>
                      <h1>Retrieval evaluation</h1>
                      <p>
                        A repeatable 12-question demo suite. Every result keeps
                        its source versions.
                      </p>
                    </div>
                    <div className="run-controls">
                      <label>
                        Top
                        <AtlasSelect
                          label="Evaluation result limit"
                          value={String(k)}
                          onChange={(value) => setK(Number(value))}
                          disabled={evaluating}
                          options={[1, 3, 5, 8].map((value) => ({
                            value: String(value),
                            label: `${value} results`,
                            description: `Inspect the top ${value} ranked passages`,
                          }))}
                        />
                      </label>
                      <button
                        className="button"
                        onClick={() => void evaluate()}
                        disabled={evaluating}
                      >
                        {evaluating ? (
                          <LoaderCircle className="spin" size={16} />
                        ) : (
                          <FlaskConical size={16} />
                        )}
                        {evaluating ? "Running suite…" : "Run evaluation"}
                      </button>
                    </div>
                  </div>
                  {activeRun ? (
                    <>
                      <div className="metrics">
                        <Metric
                          value={percent(activeRun.recall)}
                          label={`Mean recall @ ${activeRun.k}`}
                          detail="Expected sources found in the result set"
                        />
                        <Metric
                          value={activeRun.mrr.toFixed(3)}
                          label="Mean reciprocal rank"
                          detail="How early the first expected source appears"
                        />
                        <Metric
                          value={activeRun.mean_latency_ms.toFixed(2) + " ms"}
                          label="Mean retrieval time"
                          detail="This machine and this demo corpus"
                        />
                      </div>
                      <div className="evaluation-toolbar">
                        <span>
                          <span className="live-dot" />
                          {activeRun.cases.length} questions · corpus{" "}
                          {activeRun.corpus_fingerprint.slice(0, 10)}
                          {status &&
                            activeRun.corpus_fingerprint !==
                              status.corpus_fingerprint && (
                              <em> · Earlier corpus</em>
                            )}
                        </span>
                        <button
                          className="text-button"
                          onClick={() =>
                            download(activeRun, "atlas-evaluation.json")
                          }
                        >
                          <ArrowDownToLine size={15} />
                          Export full receipt
                        </button>
                      </div>
                      <RetrievalAssay
                        cases={activeRun.cases}
                        onInspect={(row) => {
                          setQuestion(row.question);
                          setAnswer({
                            answer: row.hits
                              .map((h) => `[${h.label}] ${h.body}`)
                              .join("\n\n"),
                            citations: row.hits,
                            mode: "evidence",
                            status: "complete",
                            citation_check:
                              "Saved evaluation passages; source versions are preserved.",
                          });
                          setView("workbench");
                        }}
                      />
                      <div className="case-table">
                        <div className="table-heading">
                          <span>QUESTION / EXPECTED SOURCES</span>
                          <span>RECALL</span>
                          <span>FIRST HIT</span>
                          <span>INSPECT</span>
                        </div>
                        {activeRun.cases.map((row) => (
                          <div className="case-row" key={row.id}>
                            <div>
                              <span className="case-id">{row.id}</span>
                              <strong>{row.question}</strong>
                              <small>{row.expected_sources.join(" · ")}</small>
                            </div>
                            <div>
                              <span className="mini-bar">
                                <i style={{ width: `${row.recall * 100}%` }} />
                              </span>
                              <span>{percent(row.recall)}</span>
                            </div>
                            <span>
                              {row.reciprocal_rank
                                ? "#" + Math.round(1 / row.reciprocal_rank)
                                : "Miss"}
                            </span>
                            <button
                              className="icon-button"
                              title="Inspect returned sources"
                              onClick={() => {
                                setQuestion(row.question);
                                setAnswer({
                                  answer: row.hits
                                    .map((h) => `[${h.label}] ${h.body}`)
                                    .join("\n\n"),
                                  citations: row.hits,
                                  mode: "evidence",
                                  status: "complete",
                                  citation_check:
                                    "Saved evaluation passages; source versions are preserved.",
                                });
                                setView("workbench");
                              }}
                            >
                              <ArrowUpRight size={17} />
                              <span className="sr-only">Inspect {row.id}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="run-history">
                        <h2>Run history</h2>
                        {evaluations.map((run) => (
                          <button
                            className={
                              activeRun.id === run.id ? "selected" : ""
                            }
                            key={run.id}
                            onClick={() => setSelectedRun(run)}
                          >
                            <Clock3 size={15} />
                            <span>
                              {new Date(run.created_at * 1000).toLocaleString()}
                            </span>
                            <strong>k={run.k}</strong>
                            <span>{percent(run.recall)} recall</span>
                            <ChevronRight size={14} />
                          </button>
                        ))}
                      </div>
                      <p className="fineprint">
                        These are authored demo questions, not a held-out
                        benchmark. Scores measure lexical retrieval against the
                        expected source labels; they do not measure answer
                        correctness.
                      </p>
                    </>
                  ) : (
                    <div className="empty evaluation-empty">
                      <FlaskConical size={34} />
                      <h2>Make retrieval visible.</h2>
                      <p>
                        Run the suite to see which sources are found, how they
                        rank,
                        <br />
                        and where the collection misses an expected source.
                      </p>
                      <button
                        className="button"
                        onClick={() => void evaluate()}
                      >
                        Run the first evaluation
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
            <footer className="workspace-footer">
              <span>Evidence Atlas</span>
              <span>Inspect the source. Keep the context.</span>
            </footer>
          </main>
        </div>
        {commandOpen && (
          <Suspense fallback={null}>
            <WorkspaceSearch
              open={commandOpen}
              onOpenChange={setCommandOpen}
              sources={sources}
              history={history}
              onNavigate={setView}
              onSource={(id) => void openSource(id)}
              onImport={() => setImportOpen(true)}
              onAnswer={(item) => {
                cancel();
                setNotice("");
                setView("workbench");
                setQuestion(item.question!);
                setAnswer(item);
              }}
            />
          </Suspense>
        )}
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImported={async () => {
            await refresh();
            setNotice("Source imported. Earlier versions are preserved.");
          }}
        />
        <CardDialog
          open={cardOpen}
          onOpenChange={setCardOpen}
          passages={answer?.citations ?? []}
          onSaved={async () => {
            await refresh();
            setNotice("Evidence card saved.");
          }}
        />
        <Dialog.Root
          open={sourceOpen}
          onOpenChange={(open) => {
            setSourceOpen(open);
            if (!open) {
              sourceRequest.current?.abort();
              sourceSession.current = false;
            }
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content
              className="source-sheet"
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                const target = sourceReturnFocus.current;
                (target?.isConnected ? target : searchButton.current)?.focus();
              }}
            >
              <div className="sheet-heading">
                <span className="eyebrow ink">SOURCE INSPECTOR</span>
                <Dialog.Close
                  className="icon-button"
                  aria-label="Close source inspector"
                >
                  <X size={20} />
                </Dialog.Close>
              </div>
              <Dialog.Title>
                {source ? name(source.title) : "Opening source…"}
              </Dialog.Title>
              <Dialog.Description>
                Read the original text and inspect the version behind a
                citation.
              </Dialog.Description>
              {sourceBusy && (
                <div className="empty" role="status">
                  <LoaderCircle className="spin" />
                </div>
              )}
              {source && (
                <>
                  <div className="source-metadata">
                    <label>
                      Version
                      <AtlasSelect
                        label="Source version"
                        value={source.version_id}
                        onChange={(value) => void openSource(source.id, value)}
                        options={source.versions.map((version) => ({
                          value: version.id,
                          label: version.sha256.slice(0, 10),
                          description:
                            version.id === source.active_version_id
                              ? "Current document version"
                              : "Retained earlier version",
                        }))}
                      />
                    </label>
                    <span>{source.title}</span>
                  </div>
                  {highlight && (
                    <div className="passage-range">
                      <Link2 size={14} />
                      Cited passage: lines {highlight.start_line}–
                      {highlight.end_line}
                    </div>
                  )}
                  {source.versions.length > 1 && (
                    <div
                      className="version-actions"
                      role="group"
                      aria-label="Source inspection mode"
                    >
                      <button
                        aria-pressed={!compareVersions}
                        onClick={() => setCompareVersions(false)}
                      >
                        Original text
                      </button>
                      <button
                        aria-pressed={compareVersions}
                        onClick={() => setCompareVersions(true)}
                      >
                        <GitBranch size={14} />
                        Compare versions
                      </button>
                    </div>
                  )}
                  {compareVersions ? (
                    <VersionComparison source={source} />
                  ) : (
                    <SourceLines
                      content={source.content}
                      highlight={highlight}
                    />
                  )}
                  <div className="source-hash">
                    <ShieldCheck size={14} />
                    <span>
                      Content SHA-256<code>{source.sha256}</code>
                    </span>
                  </div>
                </>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </MotionConfig>
  );
}

function ImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function read(file?: File) {
    if (!file) return;
    setContent("");
    setTitle("");
    try {
      if (!/\.(md|txt)$/i.test(file.name))
        throw new Error("Choose a Markdown (.md) or text (.txt) file.");
      if (file.size > 2_000_000)
        throw new Error("Choose a file smaller than 2 MB.");
      setContent(
        new TextDecoder("utf-8", { fatal: true }).decode(
          await file.arrayBuffer(),
        ),
      );
      setTitle(file.name);
      setError("");
    } catch (e) {
      setError(
        e instanceof TypeError
          ? "Choose a valid UTF-8 text file."
          : (e as Error).message,
      );
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/documents", {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });
      await onImported();
      onOpenChange(false);
      setTitle("");
      setContent("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="modal">
          <Dialog.Close
            className="modal-close icon-button"
            aria-label="Close import"
          >
            <X size={18} />
          </Dialog.Close>
          <span className="modal-icon">
            <Upload size={23} />
          </span>
          <Dialog.Title>Bring a source into the collection.</Dialog.Title>
          <Dialog.Description>
            Choose a UTF-8 Markdown or text document, or paste its content
            below. Up to 2 MB.
          </Dialog.Description>
          <form onSubmit={submit}>
            <AnimatedFileUpload
              accept=".md,.txt"
              multiple={false}
              maxSize={2_000_000}
              disabled={busy}
              className="atlas-file-upload"
              onFilesSelected={(files) => {
                if (files[0]) void read(files[0]);
                else {
                  setContent("");
                  setTitle("");
                }
              }}
            />
            <label>
              Document name
              <input
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="release-notes.md"
              />
            </label>
            <label>
              Source text
              <textarea
                required
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the original text here…"
              />
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="modal-footer">
              <Dialog.Close className="button secondary" type="button">
                Cancel
              </Dialog.Close>
              <button
                className="button"
                disabled={busy || !title.trim() || !content.trim()}
              >
                {busy ? "Importing…" : "Import source"}
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CardDialog({
  open,
  onOpenChange,
  passages,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passages: Passage[];
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [relations, setRelations] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const links = passages
        .filter((p) => relations[p.id])
        .map((p) => ({ chunk_id: p.id, relation: relations[p.id] }));
      await api("/cards", {
        method: "POST",
        body: JSON.stringify({ title, note, links }),
      });
      await onSaved();
      onOpenChange(false);
      setTitle("");
      setNote("");
      setRelations({});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="modal">
          <Dialog.Close
            className="modal-close icon-button"
            aria-label="Close evidence card"
          >
            <X size={18} />
          </Dialog.Close>
          <span className="modal-icon">
            <GitBranch size={23} />
          </span>
          <Dialog.Title>Save the evidence behind a conclusion.</Dialog.Title>
          <Dialog.Description>
            Choose how each passage relates to your conclusion. Conflicting
            sources are useful evidence too.
          </Dialog.Description>
          <form onSubmit={submit}>
            <label>
              Conclusion
              <input
                required
                maxLength={240}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The release needs another burst test"
              />
            </label>
            <label>
              Your context
              <textarea
                maxLength={3000}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <fieldset className="card-source-options">
              <legend>Source relationships</legend>
              {passages.map((p) => (
                <label key={p.id}>
                  <span>
                    {p.label} · {name(p.title)}
                  </span>
                  <AtlasSelect
                    label={`Relationship for ${p.label}`}
                    value={relations[p.id] || "omit"}
                    onChange={(value) =>
                      setRelations({
                        ...relations,
                        [p.id]: value === "omit" ? "" : value,
                      })
                    }
                    options={[
                      {
                        value: "omit",
                        label: "Leave out",
                        description: "Exclude from this evidence card",
                      },
                      {
                        value: "supports",
                        label: "Supports",
                        description: "Evidence agrees with the conclusion",
                      },
                      {
                        value: "contradicts",
                        label: "Contradicts",
                        description: "Evidence challenges the conclusion",
                      },
                      {
                        value: "context",
                        label: "Context",
                        description: "Background needed to read the claim",
                      },
                    ]}
                  />
                </label>
              ))}
            </fieldset>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="modal-footer">
              <Dialog.Close className="button secondary" type="button">
                Cancel
              </Dialog.Close>
              <button
                className="button"
                disabled={
                  busy ||
                  !title.trim() ||
                  !passages.some((p) => relations[p.id])
                }
              >
                {busy ? "Saving…" : "Save evidence card"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
