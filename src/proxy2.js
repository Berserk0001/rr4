const axios = require('axios');
const { pick } = require('lodash');
const { generateRandomIP, randomUserAgent } = require('./utils');
const copyHeaders = require('./copyHeaders');
const compress = require('./compress');
const bypass = require('./bypass');
const redirect = require('./redirect');
const shouldCompress = require('./shouldCompress');

// Array of predefined Via header values
const viaOptions = [
'1.1 my-proxy-service.com (MyProxy/1.0)',
'1.0 my-other-proxy.net (AnotherProxy/2.0)',
'1.1 custom-proxy-system.org (CustomProxy/3.1)',
'1.1 some-other-proxy.com (DynamicProxy/4.0)',
];

function getRandomViaHeader() {
const randomIndex = Math.floor(Math.random() * viaOptions.length);
return viaOptions[randomIndex];
}

async function proxyHandler(request, reply) {
const { url, jpeg, bw, l } = request.query;

// Handle the case where `url` is missing
if (!url) {
const randomIP = generateRandomIP();
const userAgent = randomUserAgent();
const headers = {
...pick(request.headers, ['cookie', 'dnt', 'referer']),
'x-forwarded-for': randomIP,
'user-agent': userAgent,
'via': getRandomViaHeader(), // Generate random Via header
};

// Set headers and return an invalid request response
Object.keys(headers).forEach(key => reply.header(key, headers[key]));
return reply.send('1we23');
}

// Process and clean URL
const urls = Array.isArray(url) ? url.join('&url=') : url;
const cleanedUrl = urls.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');

// Setup request parameters
    request.params.url = cleanUrl;
    request.params.webp = !jpeg;
    request.params.grayscale = bw !== '0';
    request.params.quality = parseInt(l, 10) || 40;

const randomizedIP = generateRandomIP();
const userAgent = randomUserAgent();

try {
// Perform the request using axios
const response = await axios.get(params.url, {
headers: {
...pick(request.headers, ['cookie', 'dnt', 'referer']),
'user-agent': userAgent,
'x-forwarded-for': randomizedIP,
'via': getRandomViaHeader(), // Generate random Via header
},
timeout: 10000,
maxRedirects: 5,
responseType: 'arraybuffer', // This is equivalent to `encoding: null` in `request`
decompress: true,
});

if (response.status >= 400) {
return redirect(request, reply);
}

const buffer = response.data;

copyHeaders(response, reply);
reply.header('content-encoding', 'identity');
params.originType = response.headers['content-type'] || '';
params.originSize = buffer.length;

if (shouldCompress(request)) {
compress(request, reply, buffer);
} else {
bypass(request, reply, buffer);
}
} catch (err) {
// Handle error response
return redirect(request, reply);
}
}

module.exports = proxyHandler;

