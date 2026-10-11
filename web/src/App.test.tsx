import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { App } from "./App";

const source = {
  id: "doc-1",
  title: "architecture.md",
  active_version_id: "v1",
  sha256: "abcdef123456",
  characters: 40,
  chunks: 1,
  versions: 1,
};
const passage = {
  id: "chunk-1",
  document_id: "doc-1",
  version_id: "v1",
  title: "architecture.md",
  sha256: source.sha256,
  body: "The queue stores accepted events.",
  start_line: 1,
  end_line: 1,
  label: "S1",
  score: -1,
};
const answer = {
  id: "run-1",
  question: "queue",
  answer: "[S1] The queue stores accepted events.",
  citations: [passage],
  mode: "evidence",
  status: "complete",
};
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function defaults(url: string) {
  if (url === "/api/documents") return json([source]);
  if (url === "/api/status")
    return json({
      documents: 1,
      corpus_fingerprint: "test-corpus",
      model_ready: false,
    });
  if (url.startsWith("/api/documents/doc-1"))
    return json({
      ...source,
      content: passage.body,
      version_id: "v1",
      versions: [{ id: "v1", sha256: source.sha256, created_at: 0 }],
    });
  return json([]);
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => defaults(url)),
  );
});

it("opens the exact cited source version from an answer", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options?: RequestInit) =>
      url === "/api/answers" && options?.method === "POST"
        ? json(answer)
        : defaults(url),
    ),
  );
  render(<App />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Ask the collection"), "queue");
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: "Find evidence",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  await user.click(screen.getByRole("button", { name: "Find evidence" }));
  await user.click(
    await screen.findByRole("button", { name: "Open source S1" }),
  );
  await screen.findByText("Cited passage: lines 1–1");
  expect(fetch).toHaveBeenCalledWith(
    "/api/documents/doc-1?version=v1",
    expect.anything(),
  );
  expect(screen.getByRole("dialog").textContent).toContain(passage.body);
});

it("does not display a late answer after cancellation, even if transport ignores abort", async () => {
  let complete: (response: Response) => void = () => {};
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, options?: RequestInit) =>
      url === "/api/answers" && options?.method === "POST"
        ? new Promise<Response>((resolve) => {
            complete = resolve;
          })
        : Promise.resolve(defaults(url)),
    ),
  );
  render(<App />);
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", {
      name: "Why did the burst saturate the queue?",
    }),
  );
  await user.click(await screen.findByRole("button", { name: "Cancel" }));
  await act(async () =>
    complete(json({ ...answer, answer: "This late result must not appear." })),
  );
  expect(screen.queryByText("This late result must not appear.")).toBeNull();
  expect(screen.getByRole("status").textContent).toContain("Request cancelled");
});

it("shows a provider error with a retryable form instead of a fabricated answer", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options?: RequestInit) =>
      url === "/api/answers" && options?.method === "POST"
        ? json({ detail: "Provider unavailable." }, 502)
        : defaults(url),
    ),
  );
  render(<App />);
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", {
      name: "Why did the burst saturate the queue?",
    }),
  );
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Provider unavailable.",
  );
  expect(screen.queryByText("Evidence answer")).toBeNull();
  expect(
    (screen.getByRole("button", { name: "Find evidence" }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
});

it("finds a document through keyboard search and returns focus when closed", async () => {
  render(<App />);
  const user = userEvent.setup();
  await screen.findByRole("button", { name: "List view" });
  await user.keyboard("{Control>}k{/Control}");
  await user.type(
    await screen.findByPlaceholderText("Search documents, answers, actions…"),
    "architecture",
  );
  await user.keyboard("{Enter}");
  expect((await screen.findByRole("dialog")).textContent).toContain(
    passage.body,
  );
  expect(fetch).toHaveBeenCalledWith("/api/documents/doc-1", expect.anything());
  await user.click(
    screen.getByRole("button", { name: "Close source inspector" }),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /Search anything/ }),
    ),
  );
});

it("supports arrow-key navigation and recovery from an empty library filter", async () => {
  render(<App />);
  const user = userEvent.setup();
  const workbench = screen.getByRole("tab", { name: "Investigate" });
  workbench.focus();
  await user.keyboard("{ArrowRight}");
  expect(
    screen.getByRole("tab", { name: "Sources" }).getAttribute("aria-selected"),
  ).toBe("true");
  await user.type(
    screen.getByRole("textbox", { name: "Filter source library" }),
    "missing-file",
  );
  await screen.findByText("No documents match “missing-file”.");
  await user.click(screen.getByRole("button", { name: "Clear filter" }));
  await screen.findByText("architecture.md · 40 characters");
});

it("compares a retained citation with the current source as literal text", async () => {
  const versions = [
    { id: "v2", sha256: "newhash123456", created_at: 1 },
    { id: "v1", sha256: source.sha256, created_at: 0 },
  ];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options?: RequestInit) => {
      if (url === "/api/answers" && options?.method === "POST")
        return json(answer);
      if (url.startsWith("/api/documents/doc-1"))
        return json({
          ...source,
          active_version_id: "v2",
          version_id: url.endsWith("v2") ? "v2" : "v1",
          content: url.endsWith("v2")
            ? "<script>private()</script> The queue changed."
            : passage.body,
          versions,
        });
      return defaults(url);
    }),
  );
  render(<App />);
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", {
      name: "Why did the burst saturate the queue?",
    }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Open source S1" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Compare versions" }),
  );
  await screen.findByText("<script>private()</script> The queue changed.");
  expect(fetch).toHaveBeenCalledWith(
    "/api/documents/doc-1?version=v2",
    expect.anything(),
  );
  expect(document.querySelector(".comparison-lines script")).toBeNull();
  expect(
    screen.getByText(/The source text changed between these versions/),
  ).toBeTruthy();
});

it("includes sources beyond the map limit in its readable list", async () => {
  const documents = Array.from({ length: 9 }, (_, index) => ({
    ...source,
    id: `doc-${index + 1}`,
    title: `source-${index + 1}.md`,
  }));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url === "/api/documents"
        ? json(documents)
        : url.startsWith("/api/documents/doc-9")
          ? json({
              ...documents[8],
              content: "Ninth source content.",
              version_id: "v1",
              versions: [{ id: "v1", sha256: source.sha256, created_at: 0 }],
            })
          : defaults(url),
    ),
  );
  render(<App />);
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "List view" }));
  await user.click(await screen.findByRole("button", { name: /source 9/i }));
  expect(fetch).toHaveBeenCalledWith("/api/documents/doc-9", expect.anything());
});

it("clears a previous file's content when the replacement is invalid UTF-8", async () => {
  render(<App />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Import source" }));
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const valid = new File(["Safe original text"], "first.md", {
    type: "text/markdown",
  });
  Object.defineProperty(valid, "arrayBuffer", {
    value: async () => new TextEncoder().encode("Safe original text").buffer,
  });
  await user.upload(input, valid);
  await waitFor(() =>
    expect(
      (screen.getByLabelText("Source text") as HTMLTextAreaElement).value,
    ).toBe("Safe original text"),
  );
  const invalid = new File([new Uint8Array([255])], "replacement.md", {
    type: "text/markdown",
  });
  Object.defineProperty(invalid, "arrayBuffer", {
    value: async () => new Uint8Array([255]).buffer,
  });
  await user.upload(input, invalid);
  await screen.findByText("Choose a valid UTF-8 text file.");
  expect(
    (screen.getByLabelText("Source text") as HTMLTextAreaElement).value,
  ).toBe("");
  expect(
    (screen.getByLabelText("Document name") as HTMLInputElement).value,
  ).toBe("");
});
