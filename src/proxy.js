import fetch from 'node-fetch';
import lodash from 'lodash'; // Import lodash as the default import
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
        const response = await fetch(request.params.url, {
            headers: {
                ...lodash.pick(request.headers, ['cookie', 'dnt', 'referer']),
                'user-agent': userAgent,
                'x-forwarded-for': randomIP,
                'via': randomVia(),
            },
            timeout: 10000,
            follow: 5, // max redirects
            compress: true,
        });

        if (!response.ok) {
            return handleRedirect(request, reply);
        }

        const buffer = await response.arrayBuffer();

        copyHdrs(response, reply);
        reply.header('content-encoding', 'identity');
        request.params.originType = response.headers.get('content-type') || '';
        request.params.originSize = buffer.length;

        if (checkCompression(request)) {
            return applyCompression(request, reply, buffer);
        } else {
            return performBypass(request, reply, buffer);
        }
    } catch (err) {
        return handleRedirect(request, reply);
    }
}
