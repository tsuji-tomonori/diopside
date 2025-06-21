function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // URIが/で終わる場合、index.htmlを追加
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }
    // URIがディレクトリ名のみの場合（/tagsなど）、/index.htmlを追加
    else if (!uri.includes('.') && !uri.endsWith('/')) {
        request.uri += '/index.html';
    }

    return request;
}
