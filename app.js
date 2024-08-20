#!/usr/bin/env node
'use strict';

const path = require('path');
const express = require('express');
const app = express();
const proxy = require('./src/proxy');

const PORT = process.env.PORT || 8080;


// Define paths to different favicons
const favicons = [
    path.join(__dirname, 'public', 'favicon1.ico'),
    path.join(__dirname, 'public', 'favicon2.ico'),
    //path.join(__dirname, 'public', 'favicon3.ico'),
];

// Route to serve a random favicon from the list
app.get('/favicon.ico', (req, res) => {
    const randomFavicon = favicons[Math.floor(Math.random() * favicons.length)];
    res.sendFile(randomFavicon);
});

// Trust proxy settings
app.enable('trust proxy');
app.disable('x-powered-by');
// Route with proxy functionality
app.get('/', proxy);

// Start the server
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
