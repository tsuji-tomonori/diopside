function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // 静的ファイルの場合はそのまま通す
    if (uri.includes('.')) {
        return request;
    }

    // URIが/で終わる場合、index.htmlを追加
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }
    // 動的ルートの処理: /video/[video_id]の場合はルートのindex.htmlに戻す
    // SPAとして動作させ、クライアントサイドでルーティングを処理
    else if (uri.match(/^\/video\/[^\/]+$/)) {
        request.uri = '/index.html';
    }
    // その他のディレクトリパスの場合、/index.htmlを追加
    else if (!uri.endsWith('/')) {
        request.uri += '/index.html';
    }

    return request;
}
