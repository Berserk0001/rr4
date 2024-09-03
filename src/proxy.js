"use strict";

import { request as undiciRequest } from 'undici';
import lodash from 'lodash';
import { generateRandomIP, randomUserAgent } from './utils.js';
import { shouldCompress } from './shouldCompress.js';
import { redirect } from './redirect.js';
import { compressImg } from './compress.js';
import { copyHeaders } from './copyHeaders.js';

const viaHeaders = [
    '1.1 example-proxy-service.com (ExampleProxy/1.0)',
    '1.0 another-proxy.net (Proxy/2.0)',
    '1.1 different-proxy-system.org (DifferentProxy/3.1)',
    '1.1 some-proxy.com (GenericProxy/4.0)',
];

function randomVia() {
    const index = Math.floor(Math.random() * viaHeaders.length);
    return viaHeaders[index];
}

export async function processRequest(request, reply) {
    const { url, jpeg, bw, l } = request.query;

    if (!url) {
        const ipAddress = generateRandomIP();
        const ua = randomUserAgent();
        const hdrs = {
            ...lodash.pick(request.headers, ['cookie', 'dnt', 'referer']),
            'x-forwarded-for': ipAddress,
            'user-agent': ua,
            'via': randomVia(),
        };

        Object.entries(hdrs).forEach(([key, value]) => reply.header(key, value));
        
        return reply.send(`bandwidth-hero-proxy`);
    }

    const urlList = Array.isArray(url) ? url.join('&url=') : url;
    const cleanUrl = urlList.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');

    request.params.url = cleanUrl;
    request.params.webp = !jpeg;
    request.params.grayscale = bw !== '0';
    request.params.quality = parseInt(l, 10) || 40;

    const randomIP = generateRandomIP();
    const userAgent = randomUserAgent();
    try {
        let origin = await undiciRequest(request.params.url, {
            method: 'GET',
            headers: {
                ...lodash.pick(request.headers, ['cookie', 'dnt', 'referer']),
                'user-agent': userAgent,
                'x-forwarded-for': randomIP,
                'via': randomVia(),
            },
            maxRedirections: 4
        });

        _onRequestResponse(origin, request, reply);
    } catch (err) {
        _onRequestError(request, reply, err);
    }
}

function _onRequestError(request, reply, err) {
    // Ignore invalid URL.
    if (err.code === 'ERR_INVALID_URL') {
        return reply.status(400).send('Invalid URL');
    }

    /*
     * When there's a real error, redirect and destroy the stream immediately.
     */
    redirect(request, reply);
    console.error(err);
}

function _onRequestResponse(origin, request, reply) {
    if (origin.statusCode >= 400) {
        return redirect(request, reply);
    }

    // Handle redirects
    if (origin.statusCode >= 300 && origin.headers.location) {
        return redirect(request, reply);
    }

    copyHeaders(origin, reply);
    reply.header('content-encoding', 'identity');
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Cross-Origin-Resource-Policy', 'cross-origin');
    reply.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    request.params.originType = origin.headers['content-type'] || '';
    request.params.originSize = origin.headers['content-length'] || '0';

    origin.body.on('error', () => request.raw.destroy());

    if (shouldCompress(request)) {
        /*
         * If compression is needed, pipe the origin body through the compressor.
         */
        return compressImg(request, reply, origin);
    } else {
        /*
         * If compression is not needed, pipe the origin body directly to the response.
         */
        reply.header('x-proxy-bypass', 1);

        for (const headerName of ['accept-ranges', 'content-type', 'content-length', 'content-range']) {
            if (headerName in origin.headers) {
                reply.header(headerName, origin.headers[headerName]);
            }
        }

        return origin.body.pipe(reply.raw);
    }
}
