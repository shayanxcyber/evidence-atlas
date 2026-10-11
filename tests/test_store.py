import hashlib

import pytest

from atlas.store import Store


@pytest.fixture
def store(tmp_path):
    return Store(tmp_path / "atlas.sqlite")


def test_repeated_import_and_line_endings_do_not_duplicate_versions(store):
    first = store.ingest("notes.md", "# Notes\r\nQueue limit: 32\r\n")
    second = store.ingest("notes.md", "# Notes\nQueue limit: 32\n")
    assert second["duplicate"]
    assert first["version_id"] == second["version_id"]
    assert store.documents()[0]["versions"] == 1


def test_changed_sources_preserve_old_citations_and_can_be_reactivated(store):
    first = store.ingest("notes.md", "The unicorn capacity was 32.")
    old_hit = store.search("unicorn")[0]
    store.save_card("Capacity was 32", "", [{"chunk_id": old_hit["id"], "relation": "supports"}])
    second = store.ingest("notes.md", "The dragon capacity is now 64.")
    assert not store.search("unicorn")
    assert store.search("dragon")[0]["version_id"] == second["version_id"]
    assert not store.cards()[0]["links"][0]["is_current"]
    assert (
        store.document(first["document_id"], first["version_id"])["content"] == "The unicorn capacity was 32."
    )
    store.ingest("notes.md", "The unicorn capacity was 32.")
    assert store.search("unicorn")[0]["version_id"] == first["version_id"]
    assert not store.search("dragon")
    assert store.cards()[0]["links"][0]["is_current"]


def test_citation_lines_reconstruct_the_exact_passage(store):
    content = "\n".join(f"Line {i}: scheduler concurrency detail" for i in range(45))
    result = store.ingest("long.md", content)
    hit = store.search("scheduler")[0]
    lines = content.splitlines()[hit["start_line"] - 1 : hit["end_line"]]
    assert "\n".join(lines) == hit["body"]
    assert hit["sha256"] == hashlib.sha256(content.encode()).hexdigest()
    assert hit["version_id"] == result["version_id"]


@pytest.mark.parametrize("query", ['" OR * NOT', "'); DROP TABLE documents; --", "the and of", "🛰️"])
def test_unusual_queries_are_literal_terms_and_do_not_break_storage(store, query):
    store.ingest("notes.md", "A healthy scheduler")
    assert isinstance(store.search(query), list)
    assert len(store.documents()) == 1


def test_version_lookup_cannot_cross_documents(store):
    a = store.ingest("a.md", "first")
    b = store.ingest("b.md", "second")
    with pytest.raises(KeyError):
        store.document(a["document_id"], b["version_id"])


def test_unknown_evidence_links_are_rejected_atomically(store):
    with pytest.raises(ValueError):
        store.save_card("Claim", "", [{"chunk_id": "missing", "relation": "supports"}])
    assert store.cards() == []


def test_evaluation_receipt_remains_stable_when_corpus_changes(store):
    store.seed()
    result = store.evaluate(3)
    store.ingest("new.md", "A new source")
    assert result["corpus_fingerprint"] != store.fingerprint()
    assert store.runs("evaluation")[0] == result
    assert len(result["cases"]) == 12
    assert 0 <= result["recall"] <= 1
    assert 0 <= result["mrr"] <= 1
    for case in result["cases"]:
        assert len(case["hits"]) <= 3


@pytest.mark.parametrize("title,content", [("../private.md", "x"), ("empty.md", "  "), ("binary.md", "\x00")])
def test_invalid_import_does_not_leave_partial_documents(store, title, content):
    with pytest.raises(ValueError):
        store.ingest(title, content)
    assert store.documents() == []
