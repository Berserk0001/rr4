const http = require('http');
// const authenticate = require('./src/authenticate');
const proxy = require('./src/proxy');

const PORT = process.env.PORT || 8080;

// Create the HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') {
    // Always send a 204 No Content response for /favicon.ico
    res.writeHead(204);
    res.end();
  } else {
    // Handle the root path '/' and any other paths with the proxy function
    proxy(req, res);
  }
});

// Start listening on the specified port
server.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
