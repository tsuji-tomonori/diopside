import json
from src.compute_similarity import cosine_similarity, main
from pytest import approx


def test_cosine_similarity():
    vec1 = {"a": 1, "b": 2}
    vec2 = {"a": 1, "b": 2}
    assert cosine_similarity(vec1, vec2) == approx(1.0)


def test_main(tmp_path, monkeypatch):
    vectors = {"v1": {"a": 1}, "v2": {"a": 1}, "v3": {"b": 2}}
    in_file = tmp_path / "vec.json"
    out_file = tmp_path / "out.json"
    in_file.write_text(json.dumps(vectors))
    monkeypatch.setattr("sys.argv", ["prog", str(in_file), "--output", str(out_file)])
    assert main() == 0
    result = json.loads(out_file.read_text())
    assert set(result.keys()) == {"v1", "v2", "v3"}
