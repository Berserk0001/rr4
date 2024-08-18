const fastify = require('fastify')();
const express = require('@fastify/express');
const proxy = require('./src/proxy');

const PORT = process.env.PORT || 3000;

async function start() {
  // Register the express plugin
  await fastify.register(express);

  // Use Express middleware for handling the proxy
  fastify.use('/', (req, res, next) => {
    if (req.path === '/') {
      return proxy(req, res);
    }
    next();
  });

  // Handle favicon.ico separately
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
}

start();
