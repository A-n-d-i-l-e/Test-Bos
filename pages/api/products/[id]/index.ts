import { NextApiRequest, NextApiResponse } from 'next';
import connectMongo from '../../../../lib/mongodb';
import ProductModel from '../../../../models/products';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';

// Utility function for error handling
const handleError = (res: NextApiResponse, error: unknown, customMessage: string) => {
  console.error(customMessage, error);
  res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' });
};

// Utility function to set CORS headers
const setCorsHeaders = (req: NextApiRequest, res: NextApiResponse) => {
  const allowedOrigins = ['https://bos-pay-client-portal.vercel.app', 'http://localhost:3000'];
  const origin = req.headers.origin || '';

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    setCorsHeaders(req, res); // Set CORS headers

    if (req.method === 'OPTIONS') {
      return res.status(200).end(); // Handle preflight request
    }

    await connectMongo(); // Ensure MongoDB connection
  } catch (error) {
    return handleError(res, error, 'Failed to connect to MongoDB');
  }

  const { method } = req;
  const { id } = req.query;
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate the product ID
  if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ message: 'Invalid or missing product ID' });
  }

  switch (method) {
    case 'GET':
      try {
        const product = await ProductModel.findById(id);

        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(200).json(product);
      } catch (error) {
        return handleError(res, error, 'Failed to fetch product');
      }

    case 'PUT':
      try {
        const updatedProduct = await ProductModel.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedProduct) {
          return res.status(404).json({ message: 'Product not found' });
        }

        console.log('Product updated successfully:', updatedProduct);
        return res.status(200).json(updatedProduct);
      } catch (error) {
        return handleError(res, error, 'Failed to update product');
      }

    case 'DELETE':
      try {
        const product = await ProductModel.findByIdAndDelete(id);

        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        console.log('Product deleted successfully:', product);
        return res.status(200).json({ message: 'Product deleted' });
      } catch (error) {
        return handleError(res, error, 'Failed to delete product');
      }

    default:
      return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
