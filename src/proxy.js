"use strict";
import undici from "undici";  // Import undici module
import lodash from "lodash";
import { generateRandomIP, randomUserAgent } from './utils.js';
import { copyHeaders as copyHdrs } from './copyHeaders.js';
import { compressImg as applyCompression } from './compress.js';
import { bypass as performBypass } from './bypass.js';
import { redirect as handleRedirect } from './redirect.js';
import { shouldCompress as checkCompression } from './shouldCompress.js';

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

    // If no URL is provided, just return a basic proxy response
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

    // Prepare and clean up the URL
    const urlList = Array.isArray(url) ? url.join('&url=') : url;
    const cleanUrl = urlList.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');

    // Set up request parameters
    request.params.url = cleanUrl;
    request.params.webp = !jpeg;
    request.params.grayscale = bw !== '0';
    request.params.quality = parseInt(l, 10) || 40;

    const randomIP = generateRandomIP();
    const userAgent = randomUserAgent();

    try {
        // Make the HTTP request using undici.request
        const origin = await undici.request(cleanUrl, {
            method: "GET",
            headers: {
                ...lodash.pick(request.headers, ['cookie', 'dnt', 'referer']),
                'user-agent': userAgent,
                'x-forwarded-for': randomIP,
                'via': randomVia(),
            },
            maxRedirections: 4
        });

        const { statusCode, headers, body } = origin;

        // Handle errors or redirects
        if (statusCode >= 400) {
            return handleRedirect(request, reply);
        }

        // Copy the headers from the origin response to the reply
        copyHdrs(headers, reply);
        reply.header('content-encoding', 'identity');
        request.params.originType = headers['content-type'] || '';
        request.params.originSize = parseInt(headers['content-length'], 10) || 0;

        const input = { body }; // Wrap the stream in an object

        // Determine if compression should be applied
        if (checkCompression(request)) {
            return applyCompression(request, reply, input);
        } else {
            reply.header('x-proxy-bypass', 1);

            // Copy specific headers for the bypass response
            for (const headerName of ['accept-ranges', 'content-type', 'content-length', 'content-range']) {
                if (headers[headerName]) {
                    reply.header(headerName, headers[headerName]);
                }
            }

            // Pipe the response body directly to the client
            return body.pipe(reply.raw);
        }
    } catch (err) {
        return handleRedirect(request, reply);
    }
}
