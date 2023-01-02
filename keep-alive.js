const http = require('http');

http.createServer(function(req, res) {
	res.write('Still alive -YUK11');
	res.end();
}).listen(8080);