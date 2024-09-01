#!/usr/bin/env node
'use strict';

import fastify from 'fastify';
import { processRequest } from './src/proxy.js'; // Import the named export

const app = fastify({ 
  logger: true,
  disableRequestLogging: true,
  trustProxy: true // Enable trust proxy
});

const PORT = process.env.PORT || 8080;

// Set up the route
app.get('/', async (request, reply) => {
  return processRequest(request, reply);
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
