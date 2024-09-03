"use strict";
import sharp from 'sharp';
import { redirect } from './redirect.js';

const sharpStream = _ => sharp({ animated: !process.env.NO_ANIMATE, unlimited: true });

export async function compressImg(req, res, origin) {
    const { body } = origin; // Extracting body from origin
    const format = req.params.webp ? 'webp' : 'jpeg';

    try {
        // Set up the sharp processing pipeline
        body.pipe(
            sharpStream()
                .grayscale(req.params.grayscale)
                .toFormat(format, {
                    quality: req.params.quality,
                    progressive: true,
                    optimizeScans: true,
                    chromaSubsampling: '4:4:4'
                })
                .toBuffer((err, output, info) => _sendResponse(err, output, info, format, req, res))
        );
    } catch (error) {
        return redirect(req, res);
    }
}

function _sendResponse(err, output, info, format, req, res) {
    if (err || !info) {
        return redirect(req, res);
    }

    res.setHeader('content-type', 'image/' + format);
    res.setHeader('content-length', info.size);
    res.setHeader('x-original-size', req.params.originSize);
    res.setHeader('x-bytes-saved', req.params.originSize - info.size);
    res.status(200);
    res.write(output);
    res.end();
}
