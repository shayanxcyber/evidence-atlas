export type Source = {
  id: string;
  title: string;
  active_version_id: string;
  sha256: string;
  characters: number;
  chunks: number;
  versions: number;
};
export type Passage = {
  id: string;
  document_id: string;
  version_id: string;
  title: string;
  sha256: string;
  body: string;
  start_line: number;
  end_line: number;
  label: string;
  score: number;
};
export type SourceDetail = Omit<Source, "versions"> & {
  content: string;
  version_id: string;
  versions: { id: string; sha256: string; created_at: number }[];
};
export type Answer = {
  id?: string;
  question?: string;
  answer: string;
  citations: Passage[];
  mode: string;
  status: string;
  citation_check?: string;
  latency_ms?: number;
  corpus_fingerprint?: string;
};
export type Card = {
  id: string;
  title: string;
  note: string;
  links: (Passage & { relation: string; is_current: boolean })[];
};
export type Evaluation = {
  id: string;
  created_at: number;
  k: number;
  recall: number;
  mrr: number;
  mean_latency_ms: number;
  corpus_fingerprint: string;
  suite_sha256: string;
  cases: {
    id: string;
    question: string;
    expected_sources: string[];
    found_sources: string[];
    recall: number;
    reciprocal_rank: number;
    latency_ms: number;
    hits: Passage[];
  }[];
};
export type Status = {
  documents: number;
  corpus_fingerprint: string;
  model_ready: boolean;
};

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "The request could not be completed. Check the server and try again.",
    );
  }
  if (data === null)
    throw new Error("The server returned an unreadable response.");
  return data as T;
}

export function download(data: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const name = (title: string) =>
  title.replace(/\.(md|txt)$/i, "").replaceAll("-", " ");
export const percent = (value: number) => (value * 100).toFixed(1) + "%";
