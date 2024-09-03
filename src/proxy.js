"use strict";

import undici from "undici";
import lodash from "lodash";
import { shouldCompress } from "./shouldCompress.js";
import { redirect } from "./redirect.js";
import { compressImg } from "./compress.js";
import { copyHeaders } from "./copyHeaders.js";

export async function processRequest(req, reply) {
    /*
     * Avoid loopback that could cause a server hang.
     */
    

    try {
        let origin = await undici.request(req.query.url, {
            
            headers: {
                ...lodash.pick(req.headers, ["cookie", "dnt", "referer", "range"]),
                "user-agent": "Bandwidth-Hero Compressor",
                "x-forwarded-for": req.headers["x-forwarded-for"] || req.ip,
                via: "1.1 bandwidth-hero",
            },
            maxRedirections: 4
        });

        _onRequestResponse(origin, req, reply);
    } catch (err) {
        _onRequestError(req, reply, err);
    }
}

function _onRequestError(req, reply, err) {
    // Ignore invalid URL.
    if (err.code === "ERR_INVALID_URL") {
        return reply.status(400).send("Invalid URL");
    }

    /*
     * When there's a real error, redirect and destroy the stream immediately.
     */
    redirect(req, reply);
    console.error(err);
}

function _onRequestResponse(origin, req, reply) {
    if (origin.statusCode >= 400) {
        return redirect(req, reply);
    }

    // Handle redirects
    if (origin.statusCode >= 300 && origin.headers.location) {
        return redirect(req, reply);
    }

    copyHeaders(origin, reply);
    reply.header("content-encoding", "identity");
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Cross-Origin-Resource-Policy", "cross-origin");
    reply.header("Cross-Origin-Embedder-Policy", "unsafe-none");
    req.params.originType = origin.headers["content-type"] || "";
    req.params.originSize = origin.headers["content-length"] || "0";

    origin.body.on('error', _ => req.raw.destroy());

    if (shouldCompress(req)) {
        /*
         * If compression is needed, pipe the origin body through the compressor.
         */
        return compressImg(req, reply, origin);
    } else {
        /*
         * If compression is not needed, pipe the origin body directly to the response.
         */
        reply.header("x-proxy-bypass", 1);

        for (const headerName of ["accept-ranges", "content-type", "content-length", "content-range"]) {
            if (headerName in origin.headers) {
                reply.header(headerName, origin.headers[headerName]);
            }
        }

        return origin.body.pipe(reply.raw);
    }
}
