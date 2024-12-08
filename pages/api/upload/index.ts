import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable'; // Use this if you updated to latest formidable version
import { BlobServiceClient } from '@azure/storage-blob';
import fs from 'fs';
import { getAuth } from '@clerk/nextjs/server';

export const config = {
  api: {
    bodyParser: false, // Disable bodyParser to handle file uploads manually
  },
};

const azureStorageUpload = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('Received upload request');

  try {
    // Authenticate the request using Clerk
    const { userId } = getAuth(req);
    if (!userId) {
      console.log('Unauthorized request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if the Azure Storage connection string is set
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      console.error('Missing AZURE_STORAGE_CONNECTION_STRING');
      return res.status(500).json({ error: 'Server configuration error. Missing Azure storage connection string.' });
    }

    // Initialize the formidable form to handle file uploads
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // Set a file size limit of 10MB
    });

    // Parse the incoming form data
    form.parse(req, async (err, _fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ error: 'Failed to parse form data.' });
      }

      console.log('Form parsed successfully');

      // Get the file from the form data
      const file = Array.isArray(files.imageFile) ? files.imageFile[0] : files.imageFile;
      if (!file) {
        console.log('No file provided for upload');
        return res.status(400).json({ error: 'No file provided for upload.' });
      }

      console.log('File received:', file.originalFilename);

      try {
        // Create BlobServiceClient to interact with Azure Blob Storage
        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || '');
        const containerClient = blobServiceClient.getContainerClient('images'); // Replace with your container name

        // Create a unique blob name based on timestamp and the original file name
        const blobName = `${Date.now()}-${file.originalFilename}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Read the file from the local file system
        const fileStream = fs.createReadStream(file.filepath);

        const uploadOptions = {
          bufferSize: 4 * 1024 * 1024, // 4MB buffer size
          maxConcurrency: 20, // Upload 20 parts in parallel
        };

        console.log('Starting file upload to Azure Blob Storage');

        // Upload the file to Azure Blob Storage
        await blockBlobClient.uploadStream(fileStream, uploadOptions.bufferSize, uploadOptions.maxConcurrency);
        fileStream.close(); // Close the file stream after upload is complete

        console.log('File uploaded successfully');

        // Respond with success and the URL of the uploaded file
        return res.status(200).json({ success: true, blobName, url: blockBlobClient.url });
      } catch (error) {
        console.error('Azure Blob Storage Upload Error:', error);
        return res.status(500).json({ success: false, error: 'Failed to upload image to Azure Blob Storage.' });
      }
    });  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ success: false, error: 'An unexpected error occurred.' });
  }
};

export default azureStorageUpload;