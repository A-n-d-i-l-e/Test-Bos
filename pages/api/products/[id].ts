import { NextApiRequest, NextApiResponse } from 'next';
import connectMongo from '../../../lib/mongodb';
import ProductModel from '../../../models/products';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';

const handleError = (res: NextApiResponse, error: unknown, customMessage: string) => {
  console.error(customMessage, error);
  res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  const { method } = req;
  const { id } = req.query as { id: string };
  const { userId, orgId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid or missing product ID' });
  }

  switch (method) {
    case 'GET':
      try {
        const product = await ProductModel.findById(id);

        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        // Restrict access to products within the same org or owned by the user
        if (product.orgId !== orgId && product.userId !== userId) {
          return res.status(403).json({ message: 'Access denied to this product.' });
        }

        return res.status(200).json(product);
      } catch (error) {
        return handleError(res, error, 'Failed to fetch product');
      }

    case 'PUT':
      try {
        const product = await ProductModel.findById(id);

        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        // Restrict updates to products within the same org or owned by the user
        if (product.orgId !== orgId && product.userId !== userId) {
          return res.status(403).json({ message: 'Access denied to update this product.' });
        }

        const updatedProduct = await ProductModel.findByIdAndUpdate(id, req.body, { new: true });
        return res.status(200).json(updatedProduct);
      } catch (error) {
        return handleError(res, error, 'Failed to update product');
      }

    case 'DELETE':
      try {
        const product = await ProductModel.findById(id);

        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        // Restrict deletions to products within the same org or owned by the user
        if (product.orgId !== orgId && product.userId !== userId) {
          return res.status(403).json({ message: 'Access denied to delete this product.' });
        }

        await ProductModel.findByIdAndDelete(id);
        return res.status(200).json({ message: 'Product deleted successfully' });
      } catch (error) {
        return handleError(res, error, 'Failed to delete product');
      }

    default:
      return res.status(405).json({ message: 'Method Not Allowed' });
  }
}