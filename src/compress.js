import sharp from 'sharp';
import { redirect } from './redirect.js';

export async function compressImg(request, reply, imgData) {
    const { webp, grayscale, quality, originSize } = request.params;
    const imgFormat = webp ? 'webp' : 'jpeg';

    try {
        // Initialize sharp pipeline with the input buffer
        let sharpInstance = sharp(imgData);

        // Apply grayscale only if necessary
        if (grayscale) {
            sharpInstance = sharpInstance.grayscale();
        }

        // Set format and compression options using the quality passed from request.params
        const formatOptions = {
            quality: quality, // Use the quality from request.params
            progressive: true,
            optimizeScans: webp, // Enable optimizeScans for WebP
            chromaSubsampling: '4:2:0', // Chroma subsampling for better compression speed
        };

        // Apply format conversion
        sharpInstance = sharpInstance.toFormat(imgFormat, formatOptions);

        // Convert to buffer and resolve with output size info
        const { data, info } = await sharpInstance.toBuffer({ resolveWithObject: true });

        // Prepare and send the response
        reply
            .header('content-type', `image/${imgFormat}`)
            .header('content-length', info.size)
            .header('x-original-size', originSize)
            .header('x-bytes-saved', originSize - info.size)
            .code(200)
            .send(data);
    } catch (error) {
        return redirect(request, reply);
    }
}
