import argparse
import json
from pathlib import Path

from .store import Store


def main():
    parser = argparse.ArgumentParser(description="Evidence Atlas")
    commands = parser.add_subparsers(dest="command", required=True)
    serve = commands.add_parser("serve")
    serve.add_argument("--host", default="127.0.0.1")
    serve.add_argument("--port", type=int, default=8765)
    evaluate = commands.add_parser("evaluate")
    evaluate.add_argument("--database", type=Path, default=Path(".atlas/workspace.sqlite"))
    evaluate.add_argument("--k", type=int, choices=range(1, 11), default=3)
    evaluate.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.command == "serve":
        import uvicorn

        from .api import create_app

        uvicorn.run(create_app(), host=args.host, port=args.port)
    else:
        store = Store(args.database)
        store.seed()
        result = store.evaluate(args.k)
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        print(
            json.dumps(
                {
                    key: result[key]
                    for key in ("id", "k", "recall", "mrr", "mean_latency_ms", "corpus_fingerprint")
                },
                indent=2,
            )
        )


if __name__ == "__main__":
    main()
