"use strict";
import undici from "undici";  // Importing undici
import lodash from "lodash";
import { generateRandomIP, randomUserAgent } from './utils.js';
import { copyHeaders as copyHdrs } from './copyHeaders.js';
import { compressImg as applyCompression } from './compress.js';
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

export async function processRequest(req, res) {
    const { url, jpeg, bw, l } = req.query;

    // Avoid loopback that could cause server hang
    if (
        req.headers["via"] === "1.1 example-proxy-service.com" &&
        ["127.0.0.1", "::1"].includes(req.headers["x-forwarded-for"] || req.ip)
    ) {
        return handleRedirect(req, res);
    }

    // If no URL is provided, just return a basic proxy response
    if (!url) {
        const ipAddress = generateRandomIP();
        const ua = randomUserAgent();
        const hdrs = {
            ...lodash.pick(req.headers, ['cookie', 'dnt', 'referer']),
            'x-forwarded-for': ipAddress,
            'user-agent': ua,
            'via': randomVia(),
        };

        Object.entries(hdrs).forEach(([key, value]) => res.header(key, value));
        return res.send(`bandwidth-hero-proxy`);
    }

    // Prepare and clean up the URL
    const urlList = Array.isArray(url) ? url.join('&url=') : url;
    const cleanUrl = urlList.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');

    // Set up request parameters
    req.params.url = cleanUrl;
    req.params.webp = !jpeg;
    req.params.grayscale = bw !== '0';
    req.params.quality = parseInt(l, 10) || 40;

    const randomIP = generateRandomIP();
    const userAgent = randomUserAgent();

    try {
        // Make the HTTP request using undici.request
        const origin = await undici.request(cleanUrl, {
            method: "GET",  // Explicitly specify the GET method
            headers: {
                ...lodash.pick(req.headers, ['cookie', 'dnt', 'referer']),
                'user-agent': userAgent,
                'x-forwarded-for': randomIP,
                'via': randomVia(),
            },
            maxRedirections: 4
        });

        const { statusCode, headers, body } = origin;

        // Handle errors or redirects
        if (statusCode >= 400) {
            return handleRedirect(req, res);
        }

        // Handle redirects
        if (statusCode >= 300 && headers.location) {
            return handleRedirect(req, res);
        }

        // Copy the headers from the origin response to the reply
        copyHdrs(origin, res);
        res.setHeader('content-encoding', 'identity');
        req.params.originType = headers['content-type'] || '';
        req.params.originSize = parseInt(headers['content-length'], 10) || 0;

        // Determine if compression should be applied
        if (checkCompression(req)) {
            /*
             * Compress the image by passing the response body stream to the compressImg function
             */
            return applyCompression(req, res, { body });
        } else {
            /*
             * Bypass compression and pipe the response body directly to the client
             */
            res.setHeader("x-proxy-bypass", 1);

            // Copy specific headers for the bypass response
            for (const headerName of ['accept-ranges', 'content-type', 'content-length', 'content-range']) {
                if (headers[headerName]) {
                    res.setHeader(headerName, headers[headerName]);
                }
            }

            // Pipe the response body directly to the client
            return body.pipe(res.raw);
        }
    } catch (err) {
        return handleRedirect(req, res);
    }
}
