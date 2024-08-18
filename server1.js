const fastify = require('fastify')();
const express = require('@fastify/express');
const proxy = require('./src/proxy');

const PORT = process.env.PORT || 8080;

// Register the express plugin
fastify.register(express);

// Set up the routes
fastify.use('/', (req, res) => {
  // Proxy request handling
  proxy(req, res);
});

fastify.use('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Start the server
fastify.listen(PORT, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Listening on ${address}`);
});
