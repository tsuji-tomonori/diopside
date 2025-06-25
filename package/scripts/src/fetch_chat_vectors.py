"""Fetch YouTube chat messages and build word frequency vectors."""

from __future__ import annotations

import argparse
import json
import time
from collections import defaultdict
from typing import Any, Dict, List

import pytchat
from janome.tokenizer import Tokenizer


def fetch_chat_messages(video_id: str, sleep: float = 1.0) -> List[str]:
    """Fetch all chat messages for a given video ID."""
    chat = pytchat.create(video_id=video_id)
    messages: List[str] = []
    while chat.is_alive():
        for item in chat.get().sync_items():
            messages.append(item.message)
        time.sleep(sleep)
    return messages


def build_frequency_vector(messages: List[str]) -> Dict[str, int]:
    """Build a word frequency vector from chat messages."""
    tokenizer = Tokenizer()
    freq: Dict[str, int] = defaultdict(int)
    for msg in messages:
        for token in tokenizer.tokenize(msg, wakati=True):
            token = token.strip()
            if token:
                freq[token] += 1
    return dict(freq)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fetch chat messages and create word frequency vectors"
    )
    parser.add_argument("video_ids", nargs="+", help="Target YouTube video IDs")
    parser.add_argument(
        "--output",
        default="chat_vectors.json",
        help="Output JSON file path",
    )
    args = parser.parse_args()

    result: Dict[str, Dict[str, int]] = {}
    for vid in args.video_ids:
        print(f"Fetching chat for {vid}...")
        try:
            messages = fetch_chat_messages(vid)
            result[vid] = build_frequency_vector(messages)
        except Exception as exc:  # noqa: BLE001
            print(f"Failed to process {vid}: {exc}")

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    print(f"Saved vectors to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
