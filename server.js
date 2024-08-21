#!/usr/bin/env node
'use strict';

const fastify = require('fastify')({ 
  logger: true,
  disableRequestLogging: true
});
const proxy = require('./src/proxy');

const PORT = process.env.PORT || 8080;

// Remove x-powered-by header
//fastify.removeHeader('x-powered-by');

// Set up the route
fastify.get('/', async (request, reply) => {
  return proxy(request, reply);
});

// Start the server
const start = async () => {
 try {
    await fastify.listen({ host: '0.0.0.0', port: PORT });
    console.log(`Listening on ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
