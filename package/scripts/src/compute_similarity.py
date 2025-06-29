"""Compute cosine similarity between video chat vectors."""

from __future__ import annotations

import argparse
import json
import math
from typing import Dict, List


def cosine_similarity(vec1: Dict[str, int], vec2: Dict[str, int]) -> float:
    """Compute cosine similarity between two frequency vectors."""
    intersection = set(vec1) & set(vec2)
    numerator = sum(vec1[x] * vec2[x] for x in intersection)
    sum1 = sum(v * v for v in vec1.values())
    sum2 = sum(v * v for v in vec2.values())
    denominator = math.sqrt(sum1) * math.sqrt(sum2)
    if denominator == 0:
        return 0.0
    return numerator / denominator


def main() -> int:
    parser = argparse.ArgumentParser(description="Compute video similarity")
    parser.add_argument("vectors", help="JSON file of word vectors")
    parser.add_argument(
        "--output",
        default="similar_videos.json",
        help="Output JSON file",
    )
    args = parser.parse_args()

    with open(args.vectors, "r", encoding="utf-8") as f:
        vectors: Dict[str, Dict[str, int]] = json.load(f)

    result: Dict[str, List[str]] = {}
    for vid, vec in vectors.items():
        sims: List[tuple[float, str]] = []
        for other_id, other_vec in vectors.items():
            if vid == other_id:
                continue
            sims.append((cosine_similarity(vec, other_vec), other_id))
        sims.sort(reverse=True)
        result[vid] = [v for _, v in sims[:3]]

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    print(f"Saved similarity map to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
