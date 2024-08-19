const express = require('express');
const proxy = require('./proxy'); // Assuming proxy.js is in the same directory

const app = express();

// Define a route to handle proxy requests
app.get('/proxy', (req, res) => {
  // Pass the request and response objects to the proxy function
  proxy(req, res);
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
