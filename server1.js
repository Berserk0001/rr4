const http = require('http');
// const authenticate = require('./src/authenticate');
const proxy = require('./src/proxy');

const PORT = process.env.PORT || 8080;

// Create the HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    proxy(req, res);
  } else if (req.url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start listening on the specified port
server.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
