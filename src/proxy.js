import fetch from 'node-fetch';
import lodash from 'lodash';
import { generateRandomIP, randomUserAgent } from './utils.js';
import { copyHeaders as copyHdrs } from './copyHeaders.js';
import { compressImg as applyCompression } from './compress.js';
import { bypass as performBypass } from './bypass.js';
import { redirect as handleRedirect } from './redirect.js';
import { shouldCompress as checkCompression } from './shouldCompress.js';

export function processRequest(request, reply) {
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

    fetch(request.params.url, {
        method: "GET",
        headers: {
            ...lodash.pick(request.headers, ['cookie', 'dnt', 'referer']),
            'user-agent': userAgent,
            'x-forwarded-for': randomIP,
            'via': randomVia(),
        },
        timeout: 10000,
        follow: 5, // max redirects
        compress: true,
    })
    .then((response) => {
        if (!response.ok) {
            return handleRedirect(request, reply);
        }

        copyHdrs(response, reply);
        reply.header('content-encoding', 'identity');
        request.params.originType = response.headers.get('content-type') || '';
        request.params.originSize = parseInt(response.headers.get('content-length'), 10) || 0;

        return response.body;  // This is a readable stream
    })
    .then((body) => {
        if (checkCompression(request)) {
            // Pass the response body stream to the compressImg function
            return applyCompression(request, reply, body);
        } else {
            // Pass the response body stream to the bypass function
            return performBypass(request, reply, body);
        }
    })
    .catch((err) => {
        return handleRedirect(request, reply);
    });
}
