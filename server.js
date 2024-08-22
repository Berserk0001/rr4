#!/usr/bin/env node
'use strict';

import fastify from 'fastify';
import proxy from './src/proxy.js'; // Ensure to use .js or .mjs if needed

const app = fastify({ 
  logger: true,
  disableRequestLogging: true,
  trustProxy: true // Enable trust proxy
});

const PORT = process.env.PORT || 8080;

// Set up the route
app.get('/', async (request, reply) => {
  return proxy(request, reply);
});

// Start the server
const start = async () => {
  try {
    await app.listen({ host: '0.0.0.0', port: PORT });
    console.log(`Listening on ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
