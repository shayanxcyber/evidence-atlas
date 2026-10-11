import hashlib
import json
import re
import sqlite3
import time
import uuid
from contextlib import contextmanager
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, active_version_id TEXT, created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id),
    sha256 TEXT NOT NULL, content TEXT NOT NULL, created_at REAL NOT NULL,
    UNIQUE(document_id, sha256)
);
CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY, version_id TEXT NOT NULL REFERENCES versions(id),
    start_line INTEGER NOT NULL, end_line INTEGER NOT NULL, body TEXT NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS chunk_search USING fts5(
    chunk_id UNINDEXED, title, body, tokenize='porter unicode61'
);
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, note TEXT NOT NULL, links TEXT NOT NULL, created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL, created_at REAL NOT NULL
);
"""
STOP_WORDS = frozenset(
    "a an and are as at be by can did do does for from how i in is it of on or our that the their this to was we what when where which who why with would".split()
)


def digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def query_terms(query: str) -> list[str]:
    return list(dict.fromkeys(t for t in re.findall(r"\w+", query.lower()) if t not in STOP_WORDS))[:32]


class Store:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connection() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript(SCHEMA)

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    def ingest(self, title: str, content: str) -> dict:
        title = title.strip()
        content = content.replace("\r\n", "\n").replace("\r", "\n")
        if not title or len(title) > 120 or "/" in title or "\\" in title:
            raise ValueError("Use a document name of 1–120 characters, without path separators.")
        if not content.strip() or "\x00" in content:
            raise ValueError("Import a nonempty UTF-8 text or Markdown document.")
        if len(content.encode("utf-8")) > 2_000_000:
            raise ValueError("Documents must be smaller than 2 MB.")
        document_id = "d_" + digest(title.casefold())[:24]
        sha = digest(content)
        version_id = "v_" + digest(document_id + "\0" + sha)[:24]
        now = time.time()
        with self.connection() as db:
            db.execute("INSERT OR IGNORE INTO documents VALUES (?, ?, NULL, ?)", (document_id, title, now))
            duplicate = db.execute("SELECT 1 FROM versions WHERE id=?", (version_id,)).fetchone() is not None
            if not duplicate:
                db.execute(
                    "INSERT INTO versions VALUES (?, ?, ?, ?, ?)",
                    (version_id, document_id, sha, content, now),
                )
                lines = content.splitlines()
                for start in range(0, len(lines), 12):
                    end = min(start + 16, len(lines))
                    body = "\n".join(lines[start:end])
                    if not body.strip():
                        continue
                    chunk_id = "c_" + digest(f"{version_id}:{start}")[:24]
                    db.execute(
                        "INSERT INTO chunks VALUES (?, ?, ?, ?, ?)",
                        (chunk_id, version_id, start + 1, end, body),
                    )
            # Keep the searchable corpus limited to active versions. Old chunks remain valid citations.
            db.execute(
                "DELETE FROM chunk_search WHERE chunk_id IN (SELECT c.id FROM chunks c JOIN versions v ON c.version_id=v.id WHERE v.document_id=?)",
                (document_id,),
            )
            db.execute(
                "INSERT INTO chunk_search SELECT id, ?, body FROM chunks WHERE version_id=?",
                (title, version_id),
            )
            db.execute("UPDATE documents SET active_version_id=? WHERE id=?", (version_id, document_id))
        return {"document_id": document_id, "version_id": version_id, "sha256": sha, "duplicate": duplicate}

    def documents(self) -> list[dict]:
        with self.connection() as db:
            rows = db.execute("""SELECT d.*, v.sha256, length(v.content) AS characters,
                (SELECT count(*) FROM chunks WHERE version_id=v.id) AS chunks,
                (SELECT count(*) FROM versions WHERE document_id=d.id) AS versions
                FROM documents d JOIN versions v ON d.active_version_id=v.id ORDER BY d.title""").fetchall()
            return [dict(row) for row in rows]

    def document(self, document_id: str, version_id: str | None = None) -> dict:
        with self.connection() as db:
            doc = db.execute("SELECT * FROM documents WHERE id=?", (document_id,)).fetchone()
            if doc is None:
                raise KeyError(document_id)
            version = db.execute(
                "SELECT * FROM versions WHERE id=? AND document_id=?",
                (version_id or doc["active_version_id"], document_id),
            ).fetchone()
            if version is None:
                raise KeyError(version_id)
            versions = [
                dict(row)
                for row in db.execute(
                    "SELECT id, sha256, created_at FROM versions WHERE document_id=? ORDER BY created_at DESC, id",
                    (document_id,),
                )
            ]
            return {
                **dict(doc),
                **dict(version),
                "id": document_id,
                "version_id": version["id"],
                "versions": versions,
            }

    def search(self, query: str, limit: int = 4) -> list[dict]:
        with self.connection() as db:
            return self._search(db, query, limit)

    def _search(self, db, query: str, limit: int) -> list[dict]:
        terms = query_terms(query)
        if not terms:
            return []
        match = " OR ".join('"' + term + '"' for term in terms)
        rows = db.execute(
            """SELECT c.*, v.document_id, v.sha256, d.title,
                bm25(chunk_search, 0.0, 2.0, 1.0) AS score
                FROM chunk_search JOIN chunks c ON chunk_search.chunk_id=c.id
                JOIN versions v ON c.version_id=v.id JOIN documents d ON v.document_id=d.id
                WHERE chunk_search MATCH ? AND d.active_version_id=v.id
                ORDER BY score, c.id""",
            (match,),
        ).fetchall()
        seen = set()
        results = []
        for row in rows:
            if row["document_id"] in seen:
                continue
            seen.add(row["document_id"])
            results.append({**dict(row), "label": f"S{len(results) + 1}"})
            if len(results) >= limit:
                break
        return results

    def fingerprint(self) -> str:
        with self.connection() as db:
            return self._fingerprint(db)

    def _fingerprint(self, db) -> str:
        return digest(
            "\n".join(
                row[0]
                for row in db.execute("SELECT active_version_id FROM documents ORDER BY active_version_id")
            )
        )

    def retrieve(self, query: str, limit: int) -> dict:
        with self.connection() as db:
            db.execute("BEGIN")
            return {"hits": self._search(db, query, limit), "corpus_fingerprint": self._fingerprint(db)}

    def save_card(self, title: str, note: str, links: list[dict]) -> dict:
        with self.connection() as db:
            for link in links:
                if db.execute("SELECT 1 FROM chunks WHERE id=?", (link["chunk_id"],)).fetchone() is None:
                    raise ValueError("One of these source passages no longer exists.")
            card_id = "e_" + uuid.uuid4().hex
            db.execute(
                "INSERT INTO cards VALUES (?, ?, ?, ?, ?)",
                (card_id, title, note, json.dumps(links), time.time()),
            )
        return next(card for card in self.cards() if card["id"] == card_id)

    def cards(self) -> list[dict]:
        with self.connection() as db:
            cards = []
            for row in db.execute("SELECT * FROM cards ORDER BY created_at DESC"):
                links = []
                for link in json.loads(row["links"]):
                    source = db.execute(
                        """SELECT c.*, v.document_id, v.sha256, d.title,
                        (d.active_version_id=v.id) AS is_current FROM chunks c JOIN versions v ON c.version_id=v.id
                        JOIN documents d ON v.document_id=d.id WHERE c.id=?""",
                        (link["chunk_id"],),
                    ).fetchone()
                    links.append({**dict(source), "relation": link["relation"]})
                cards.append({**dict(row), "links": links})
            return cards

    def save_run(self, kind: str, payload: dict) -> dict:
        run = {**payload, "id": "r_" + uuid.uuid4().hex, "created_at": time.time()}
        with self.connection() as db:
            db.execute(
                "INSERT INTO runs VALUES (?, ?, ?, ?)", (run["id"], kind, json.dumps(run), run["created_at"])
            )
        return run

    def runs(self, kind: str) -> list[dict]:
        with self.connection() as db:
            return [
                json.loads(row["payload"])
                for row in db.execute(
                    "SELECT payload FROM runs WHERE kind=? ORDER BY created_at DESC LIMIT 20", (kind,)
                )
            ]

    def seed(self):
        if self.documents():
            return
        demo = Path(__file__).parent / "demo"
        for path in sorted(demo.glob("*.md")):
            self.ingest(path.name, path.read_text(encoding="utf-8"))
        sources = {doc["title"]: doc for doc in self.documents()}
        with self.connection() as db:

            def first_chunk(title):
                return db.execute(
                    "SELECT id FROM chunks WHERE version_id=? ORDER BY start_line LIMIT 1",
                    (sources[title]["active_version_id"],),
                ).fetchone()[0]

            links = [
                {"chunk_id": first_chunk("load-test.md"), "relation": "supports"},
                {"chunk_id": first_chunk("incident-review.md"), "relation": "contradicts"},
            ]
        self.save_card(
            "The release is ready for a full rollout",
            "The steady-state test passed, but the burst incident exposes an unresolved limit. Keep these conditions separate before approving rollout.",
            links,
        )

    def evaluate(self, k: int = 3) -> dict:
        cases = json.loads((Path(__file__).parent / "demo/evaluation.json").read_text(encoding="utf-8"))
        results = []
        with self.connection() as db:
            db.execute("BEGIN")
            fingerprint = self._fingerprint(db)
            for case in cases:
                started = time.perf_counter()
                hits = self._search(db, case["question"], k)
                latency = (time.perf_counter() - started) * 1000
                found = [hit["title"] for hit in hits]
                expected = case["expected_sources"]
                rank = next((i + 1 for i, title in enumerate(found) if title in expected), 0)
                results.append(
                    {
                        **case,
                        "found_sources": found,
                        "recall": len(set(found) & set(expected)) / len(expected),
                        "reciprocal_rank": 1 / rank if rank else 0,
                        "latency_ms": round(latency, 3),
                        "hits": hits,
                    }
                )
        return self.save_run(
            "evaluation",
            {
                "k": k,
                "corpus_fingerprint": fingerprint,
                "suite_sha256": digest(json.dumps(cases, sort_keys=True)),
                "cases": results,
                "recall": sum(r["recall"] for r in results) / len(results),
                "mrr": sum(r["reciprocal_rank"] for r in results) / len(results),
                "mean_latency_ms": sum(r["latency_ms"] for r in results) / len(results),
            },
        )
