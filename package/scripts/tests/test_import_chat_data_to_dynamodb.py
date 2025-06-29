import json
from unittest.mock import Mock, patch

from src.import_chat_data_to_dynamodb import import_data, main


def test_import_data():
    table = Mock()
    with patch("boto3.resource") as mock_resource:
        mock_resource.return_value.Table.return_value = table
        import_data("tbl", {"v1": {"a": 1}}, {"v1": ["x"]})
        table.put_item.assert_called_once()


def test_main(monkeypatch, tmp_path):
    vectors = {"v1": {"a": 1}}
    related = {"v1": ["x"]}
    vec_file = tmp_path / "vec.json"
    rel_file = tmp_path / "rel.json"
    vec_file.write_text(json.dumps(vectors))
    rel_file.write_text(json.dumps(related))
    with patch("boto3.resource") as mock_resource:
        mock_resource.return_value.Table.return_value = Mock()
        monkeypatch.setattr(
            "sys.argv",
            ["prog", "tbl", str(vec_file), str(rel_file)],
        )
        assert main() == 0
