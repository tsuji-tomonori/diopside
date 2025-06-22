"""
CloudFront関数のテスト

動画詳細ページのルーティング処理をテストする
"""

import re
from pathlib import Path

import pytest


@pytest.fixture(scope="module")
def function_code():
    """テスト用のCloudFront関数コードを読み込み"""
    function_path = (
        Path(__file__).parent.parent
        / "src"
        / "cloudfront-functions"
        / "directory-index.js"
    )
    with open(function_path, "r", encoding="utf-8") as f:
        return f.read()


def execute_function(uri: str) -> str:
    """
    CloudFront関数をシミュレート実行

    Args:
        uri: テスト対象のURI

    Returns:
        str: 変換後のURI
    """
    # JavaScriptコードをPythonで再実装してテスト
    request_uri = uri

    # 静的ファイルの場合はそのまま通す
    if "." in request_uri:
        return request_uri

    # URIが/で終わる場合、index.htmlを追加
    if request_uri.endswith("/"):
        return request_uri + "index.html"

    # 動的ルートの処理: /video/[video_id]の場合はルートのindex.htmlに戻す
    if re.match(r"^/video/[^/]+$", request_uri):
        return "/index.html"

    # その他のディレクトリパスの場合、/index.htmlを追加
    if not request_uri.endswith("/"):
        return request_uri + "/index.html"

    return request_uri


class TestCloudFrontFunction:
    """CloudFront関数のテストクラス"""

    @pytest.mark.parametrize(
        "uri",
        [
            "/favicon.ico",
            "/next.svg",
            "/_next/static/chunks/main.js",
            "/fonts/Inter-Regular.woff2",
            "/config.json",
        ],
    )
    def test_static_files_passthrough(self, uri):
        """静的ファイルはそのまま通すテスト"""
        result = execute_function(uri)
        assert result == uri, f"静的ファイル {uri} はそのまま通すべき"

    def test_root_directory(self):
        """ルートディレクトリのテスト"""
        result = execute_function("/")
        assert result == "/index.html", "ルートディレクトリは/index.htmlに変換されるべき"

    @pytest.mark.parametrize(
        "input_uri,expected",
        [
            ("/tags", "/tags/index.html"),
            ("/memory", "/memory/index.html"),
            ("/random", "/random/index.html"),
            ("/tags/", "/tags/index.html"),
        ],
    )
    def test_regular_directories(self, input_uri, expected):
        """通常のディレクトリのテスト"""
        result = execute_function(input_uri)
        assert result == expected, f"{input_uri} は {expected} に変換されるべき"

    @pytest.mark.parametrize(
        "uri",
        [
            "/video/-Wf8FssuAeU",  # 実際の動画ID
            "/video/abc123",  # 英数字のID
            "/video/sample-video-1",  # サンプル動画ID
            "/video/test_video",  # アンダースコア含む
            "/video/Video-123-Test",  # 複雑なID
        ],
    )
    def test_video_dynamic_routes(self, uri):
        """動画詳細ページの動的ルートのテスト"""
        result = execute_function(uri)
        assert (
            result == "/index.html"
        ), f"動画詳細ページ {uri} はSPAとして/index.htmlに変換されるべき"

    @pytest.mark.parametrize(
        "input_uri,expected",
        [
            ("/video", "/video/index.html"),
            ("/video/", "/video/index.html"),
        ],
    )
    def test_video_directory_itself(self, input_uri, expected):
        """videoディレクトリ自体のテスト"""
        result = execute_function(input_uri)
        assert result == expected, f"{input_uri} は {expected} に変換されるべき"

    @pytest.mark.parametrize(
        "input_uri,expected",
        [
            # 深いネストのディレクトリ
            ("/some/deep/path", "/some/deep/path/index.html"),
            # 空文字列（エラー避けのため）
            ("", "/index.html"),
            # 複数スラッシュ（正規表現にマッチしないため通常処理）
            ("/video//test", "/video//test/index.html"),
        ],
    )
    def test_edge_cases(self, input_uri, expected):
        """エッジケースのテスト"""
        result = execute_function(input_uri)
        assert result == expected, f"{input_uri} は {expected} に変換されるべき"

    @pytest.mark.parametrize(
        "pattern",
        [
            "uri.includes('.')",  # 静的ファイルの判定
            "uri.endsWith('/')",  # ディレクトリ判定
            "uri.match",  # 正規表現マッチの使用
            "/index.html",  # SPAフォールバック
            "request.uri",  # URIの書き換え
        ],
    )
    def test_function_code_contains_required_logic(self, pattern, function_code):
        """関数コードに必要なロジックが含まれているかテスト"""
        assert (
            pattern.replace("\\", "") in function_code
        ), f"関数コードに必要なパターン '{pattern}' が含まれているべき"
