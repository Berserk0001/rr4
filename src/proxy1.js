// ./src/proxy.js

const { fetch } = require('undici'); // Import fetch from undici
const pick = require('lodash').pick; // Directly import the pick function
const { generateRandomIP, randomUserAgent } = require('./utils');
const copyHdrs = require('./copyHeaders');
const applyCompression = require('./compress');
const performBypass = require('./bypass');
const handleRedirect = require('./redirect');
const checkCompression = require('./shouldCompress');

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

async function processRequest(request, reply) {
    const { url, jpeg, bw, l } = request.query;

    if (!url) {
        const ipAddress = generateRandomIP();
        const ua = randomUserAgent();
        const hdrs = {
            ...pick(request.headers, ['cookie', 'dnt', 'referer']),
            'x-forwarded-for': ipAddress,
            'user-agent': ua,
            'via': randomVia(),
        };

        Object.entries(hdrs).forEach(([key, value]) => reply.header(key, value));
        
        return reply.send(`1we23`);
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
                ...pick(request.headers, ['cookie', 'dnt', 'referer']),
                'user-agent': userAgent,
                'x-forwarded-for': randomIP,
                'via': randomVia(),
            },
            timeout: 10000,
            follow: 5, // max redirects
            compress: true,
        });

        if (response.statusCode >= 400) {
            return handleRedirect(request, reply);
        }

        const buffer = Buffer.from(await response.body.arrayBuffer());

        copyHdrs(response, reply);
        reply.header('content-encoding', 'identity');
        request.params.originType = response.headers['content-type'] || '';
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

module.exports = processRequest;
