import { Request, Response } from 'express';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { S3 } from 'aws-sdk';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
const execAsync = promisify(exec);

import TrackingImage from '../models/tracking-image.model';

// Create a new tracking image
export const createTrackingImage = async (req: Request, res: Response): Promise<Response> => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Get uploaded image file from req.file
        const imageFile: Express.Multer.File = req.file as Express.Multer.File;
        if (!imageFile) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const originalFileSize = imageFile.size; // Original file size in bytes

        // Azure Blob Storage credentials
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'crmpublicimg';
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
        }
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Generate a unique blob name based on the original filename and current timestamp
        const originalFileName = imageFile.originalname;
        const fileExtension = originalFileName.split('.').pop()?.toLowerCase(); // Extract file extension and convert to lower case

        if (!fileExtension) {
            throw new Error('File extension could not be determined.');
        }
        const timestamp = Date.now();
        const blobName: string = `${originalFileName}_${timestamp}.${fileExtension}`; // Append file extension to original filename
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        let data: Buffer = imageFile.buffer as Buffer;
        let compressedFileSize: number = data.length;

        // Compress the file if it is an image or a PDF
        if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png') {
            data = await sharp(data)
                .resize({ width: 1000 })
                .jpeg({ quality: 75 })
                .toBuffer();
            compressedFileSize = data.length; // Update compressed file size
        } else if (fileExtension === 'pdf') {
            const compressedPdfPath = `/tmp/compressed_${timestamp}.pdf`;
            const originalPdfPath = `/tmp/original_${timestamp}.pdf`;

            // Save the original PDF to a temporary file
            await fs.promises.writeFile(originalPdfPath, data);

            // Use ghostscript to compress the PDF
            await execAsync(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${compressedPdfPath} ${originalPdfPath}`);

            // Read the compressed PDF back into a buffer
            data = await fs.promises.readFile(compressedPdfPath);
            compressedFileSize = data.length; // Update compressed file size

            // Clean up temporary files
            await fs.promises.unlink(originalPdfPath);
            await fs.promises.unlink(compressedPdfPath);
        }

        // Upload file to Azure Blob Storage
        await blockBlobClient.upload(data, data.length);

        const { trackingInfoId, type } = req.body;

        // Create the tracking image
        const newTrackingImage = await TrackingImage.create({
            imgSrc: blockBlobClient.url,
            type,
            trackingInfoId: parseInt(trackingInfoId),
        });

        return res.status(201).json({
            message: 'Tracking image created successfully',
            trackingImage: newTrackingImage,
            originalFileSize: `${(originalFileSize / (1024 * 1024)).toFixed(2)} MB`,
            compressedFileSize: `${(compressedFileSize / (1024 * 1024)).toFixed(2)} MB`,
        });
    } catch (error: any) {
        console.error('Error creating tracking image:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// AWS S3 credentials (read from environment when re-enabled)
// const bucketName = process.env.AWS_S3_BUCKET_NAME;
// const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
// const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// const s3 = new S3({
//     accessKeyId: accessKeyId,
//     secretAccessKey: secretAccessKey,
// });

// // Generate a unique key (filename) for the S3 object
// const originalFileName = imageFile.originalname;
// const timestamp = Date.now();
// const key: string = `${timestamp}_${originalFileName}`;

// // Upload file to Amazon S3
// const params = {
//     Bucket: bucketName,
//     Key: key,
//     Body: imageFile.buffer,
// };          

// await s3.upload(params).promise();

// const { trackingInfoId, type } = req.body;

// // Create the tracking image
// const newTrackingImage = await TrackingImage.create({
//     imgSrc: `https://${bucketName}.s3.amazonaws.com/${key}`,
//     type,
//     trackingInfoId: parseInt(trackingInfoId),
// });

// Get all tracking images
export const getAllTrackingImages = async (req: Request, res: Response): Promise<Response> => {
    try {
        const trackingImages = await TrackingImage.findAll();
        return res.status(200).json({ trackingImages });
    } catch (error: any) {
        console.error('Error fetching tracking images:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update a tracking image
export const updateTrackingImage = async (req: Request, res: Response): Promise<Response> => {
    const id = parseInt(req.params.id);
    const { imgSrc, trackingInfoId } = req.body;

    try {
        const trackingImage = await TrackingImage.findByPk(id);
        if (!trackingImage) {
            return res.status(404).json({ message: 'Tracking image not found' });
        }

        trackingImage.imgSrc = imgSrc;
        trackingImage.trackingInfoId = trackingInfoId; // Update trackingInfoId if needed
        await trackingImage.save();

        return res.status(200).json({ message: 'Tracking image updated successfully', trackingImage });
    } catch (error: any) {
        console.error('Error updating tracking image:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete a tracking image
export const deleteTrackingImage = async (req: Request, res: Response): Promise<Response> => {
    const id = parseInt(req.params.id);

    try {
        const trackingImage = await TrackingImage.findByPk(id);
        if (!trackingImage) {
            return res.status(404).json({ message: 'Tracking image not found' });
        }

        await trackingImage.destroy();

        return res.status(200).json({ message: 'Tracking image deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting tracking image:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'crmpublicimg';
const azureAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const azureAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const sharedKeyCredential = new StorageSharedKeyCredential(azureAccountName, azureAccountKey);
const blobServiceClient = new BlobServiceClient(
    `https://${azureAccountName}.blob.core.windows.net`,
    sharedKeyCredential
);

// Function to convert stream to buffer
async function streamToBuffer(readableStream: NodeJS.ReadableStream | undefined): Promise<Buffer> {
    if (!readableStream) {
        throw new Error('ReadableStream is undefined or null');
    }

    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        readableStream.on('data', (data: Uint8Array | Buffer) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on('error', reject);
    });
}

// Function to get file size in bytes
const getFileSizeInBytes = (buffer: Buffer): number => {
    return Buffer.byteLength(buffer);
}

// Function to convert bytes to human-readable format
const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Function to compress and replace images
async function compressAndReplaceImages(req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const results = [];

    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);

        for await (const blob of containerClient.listBlobsFlat()) {
            if (!blob.name.toLowerCase().endsWith('.jpg') && !blob.name.toLowerCase().endsWith('.jpeg')) {
                continue;
            }

            const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
            
            try {
                // Download the blob content
                const downloadBlockBlobResponse = await blockBlobClient.download();
                const readableStreamBody = downloadBlockBlobResponse.readableStreamBody;

                if (!readableStreamBody) {
                    throw new Error('ReadableStreamBody is undefined or null');
                }

                const downloadedContent = await streamToBuffer(readableStreamBody);
                const originalSize = getFileSizeInBytes(downloadedContent);

                // Compress the image using Sharp
                const compressedImage = await sharp(downloadedContent).jpeg({ quality: 50 }).toBuffer();
                const compressedSize = getFileSizeInBytes(compressedImage);

                // Upload the compressed image back to Azure Blob Storage
                await blockBlobClient.uploadData(compressedImage, {
                    blobHTTPHeaders: { blobContentType: 'image/jpeg' },
                });

                const result = {
                    file: blob.name,
                    originalSize: formatBytes(originalSize),
                    compressedSize: formatBytes(compressedSize),
                    compressionRatio: (compressedSize / originalSize).toFixed(2),
                    message: `Compressed and replaced image: ${blob.name}`
                };

                results.push(result); // Add result to the array
                res.write(`data: ${JSON.stringify(result)}\n\n`);
            } catch(error: any) {
                results.push({ fileName: blob.name, error: error.message });
            }
        }

        res.write(`data: ${JSON.stringify(results)}\n\n`); // Send the accumulated results
        res.write('event: end\ndata: "Images compressed and replaced successfully."\n\n');
        res.end();
    } catch (error: any) {
        console.error('Error compressing images:', error.message);
        res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
}

// Export the controller function
export { compressAndReplaceImages };