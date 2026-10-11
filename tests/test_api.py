import httpx
import pytest
from fastapi.testclient import TestClient

from atlas import api


@pytest.fixture
def client(tmp_path):
    with TestClient(api.create_app(tmp_path / "atlas.sqlite")) as client:
        yield client


def test_demo_boots_and_excerpts_link_to_actual_source_lines(client):
    assert len(client.get("/api/documents").json()) == 8
    result = client.post("/api/answers", json={"question": "Why did the burst saturate the queue?"}).json()
    assert result["status"] == "complete"
    for hit in result["citations"]:
        source = client.get(
            f"/api/documents/{hit['document_id']}", params={"version": hit["version_id"]}
        ).json()
        assert (
            "\n".join(source["content"].splitlines()[hit["start_line"] - 1 : hit["end_line"]]) == hit["body"]
        )
    saved = client.get(f"/api/runs/{result['id']}").json()
    assert saved == result


def test_no_evidence_is_explicit_and_does_not_create_an_answer_run(client):
    response = client.post("/api/answers", json={"question": "xyzzymissingword"})
    assert response.json()["status"] == "no_evidence"
    assert response.json()["citations"] == []
    assert client.get("/api/answers").json() == []


def test_model_configuration_is_server_side_and_missing_configuration_is_clear(client, monkeypatch):
    monkeypatch.delenv("ATLAS_PROVIDER_URL", raising=False)
    monkeypatch.delenv("ATLAS_MODEL", raising=False)
    assert client.get("/api/status").json()["model_ready"] is False
    assert client.post("/api/answers", json={"question": "retry", "mode": "model"}).status_code == 409


@pytest.mark.parametrize(
    "text,status",
    [("Retry starts after two seconds [S1].", 200), ("Claim [S99].", 502), ("No citations", 502)],
)
def test_provider_contract_and_invalid_citation_rejection(client, monkeypatch, text, status):
    monkeypatch.setenv("ATLAS_PROVIDER_URL", "https://provider.invalid/v1")
    monkeypatch.setenv("ATLAS_PROVIDER_KEY", "dummy-private-key")
    monkeypatch.setenv("ATLAS_MODEL", "test-model")

    def handler(request):
        assert request.headers["Authorization"] == "Bearer dummy-private-key"
        assert str(request.url) == "https://provider.invalid/v1/chat/completions"
        return httpx.Response(200, json={"choices": [{"message": {"content": text}}]})

    original = httpx.AsyncClient
    monkeypatch.setattr(
        api.httpx, "AsyncClient", lambda **kw: original(transport=httpx.MockTransport(handler), **kw)
    )
    response = client.post("/api/answers", json={"question": "retry", "mode": "model"})
    assert response.status_code == status
    assert "dummy-private-key" not in response.text
    assert len(client.get("/api/answers").json()) == (1 if status == 200 else 0)


def test_import_and_evaluation_api_keep_receipts(client):
    assert (
        client.post(
            "/api/documents", json={"title": "custom.md", "content": "A custom queue rule"}
        ).status_code
        == 201
    )
    result = client.post("/api/evaluations?k=3").json()
    assert result["k"] == 3
    assert client.get("/api/evaluations").json()[0] == result
    assert client.get(f"/api/runs/{result['id']}").json() == result
    assert client.get("/api/runs/missing").status_code == 404


def test_validation_boundaries(client):
    assert client.get("/api/search?q=retry&limit=0").status_code == 422
    assert client.post("/api/documents", json={"title": "../../private", "content": "x"}).status_code == 422
    assert (
        client.post(
            "/api/cards", json={"title": "Claim", "links": [{"chunk_id": "missing", "relation": "supports"}]}
        ).status_code
        == 422
    )
