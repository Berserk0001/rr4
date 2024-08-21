#!/usr/bin/env node
'use strict';

const fastify = require('fastify')({ 
  logger: true,
  disableRequestLogging: true
});
const proxy = require('./src/proxy');

const PORT = process.env.PORT || 8080;

// Remove x-powered-by header
fastify.removeHeader('x-powered-by');

// Set up the route
fastify.get('/', async (request, reply) => {
  return proxy(request, reply);
});

// Start the server
const start = async () => {
  try {
    await fastify.listen(PORT, '0.0.0.0');
    console.log(`Server listening on ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
