import json
from types import SimpleNamespace

import pytest
from src.fetch_chat_vectors import build_frequency_vector, fetch_chat_messages, main


class DummyChat:
    def __init__(self, messages):
        self._messages = messages
        self._index = 0

    def is_alive(self):
        return self._index < 1

    def get(self):
        self._index += 1
        return SimpleNamespace(sync_items=lambda: [SimpleNamespace(message=m) for m in self._messages])


def test_build_frequency_vector():
    msgs = ["a a b", "b c"]
    vector = build_frequency_vector(msgs)
    assert vector["a"] == 2
    assert vector["b"] == 2
    assert vector["c"] == 1


def test_main(monkeypatch, tmp_path):
    dummy = DummyChat(["hello", "world"])
    monkeypatch.setattr("pytchat.create", lambda video_id: dummy)
    out = tmp_path / "out.json"
    monkeypatch.setattr("sys.argv", ["prog", "vid1", "--output", str(out)])
    assert main() == 0
    data = json.loads(out.read_text())
    assert "vid1" in data
