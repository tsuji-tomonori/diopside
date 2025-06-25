"""Import chat analysis data into DynamoDB."""

from __future__ import annotations

import argparse
import json
from typing import Dict, List

import boto3
from botocore.exceptions import ClientError


def import_data(
    table_name: str,
    vectors: Dict[str, Dict[str, int]],
    related: Dict[str, List[str]],
) -> None:
    table = boto3.resource("dynamodb").Table(table_name)
    for video_id, vector in vectors.items():
        item = {
            "video_id": video_id,
            "word_vector": vector,
            "related_videos": related.get(video_id, []),
        }
        try:
            table.put_item(Item=item)  # type: ignore[arg-type]
        except ClientError as exc:  # noqa: BLE001
            print(f"Failed to put {video_id}: {exc}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Import chat data to DynamoDB")
    parser.add_argument("table", help="DynamoDB table name")
    parser.add_argument("vectors", help="Word vector JSON file")
    parser.add_argument("related", help="Similarity JSON file")
    args = parser.parse_args()

    with open(args.vectors, "r", encoding="utf-8") as f:
        vectors: Dict[str, Dict[str, int]] = json.load(f)
    with open(args.related, "r", encoding="utf-8") as f:
        related: Dict[str, List[str]] = json.load(f)

    import_data(args.table, vectors, related)
    print("Import completed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
