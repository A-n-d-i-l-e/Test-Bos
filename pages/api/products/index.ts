import { NextApiRequest, NextApiResponse } from 'next';
import Product from '@/models/products';
import connectMongo from '../../../lib/mongodb';
import { getAuth } from '@clerk/nextjs/server';

// Utility function to set CORS headers
const setCorsHeaders = (res: NextApiResponse) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000, https://bos-pay-client-portal.vercel.app/dashboard');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  // Set CORS headers for all requests
  setCorsHeaders(res);

  // Connect to MongoDB
  try {
    await connectMongo();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return res.status(500).json({ message: 'Failed to connect to MongoDB' });
  }

  // Validate Clerk session
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing Clerk session' });
  }

  switch (req.method) {
    case 'GET': {
      try {
        // Fetch products associated with the authenticated user
        const products = await Product.find({ userId });
        return res.status(200).json(
          products.map((product) => ({
            id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            stock: product.stock,
            image: product.imageUrl,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch products:', error);
        return res.status(500).json({ message: 'Failed to fetch products' });
      }
    }

    case 'POST': {
      try {
        const { name, description, price, category, stock, imageUrl } = req.body;

        // Ensure all required fields are provided
        if (!name || !description || !price || !category || !stock || !imageUrl) {
          return res.status(400).json({ message: 'Missing required fields.' });
        }

        const newProduct = new Product({
          name,
          description,
          price,
          category,
          stock,
          imageUrl,
          userId,
        });
        await newProduct.save();

        return res.status(201).json({
          id: newProduct._id,
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          category: newProduct.category,
          stock: newProduct.stock,
          image: newProduct.imageUrl,
        });
      } catch (error) {
        console.error('Failed to create product:', error);
        return res.status(500).json({ message: 'Failed to create product' });
      }
    }

    default:
      return res.status(405).json({ message: 'Method Not Allowed' });
  }
}