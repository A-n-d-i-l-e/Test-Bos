import { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'cors';
import Product from '@/models/products';
import connectMongo from '../../../lib/mongodb';
import { getAuth } from '@clerk/nextjs/server';

// Initialize CORS middleware
const cors = Cors({
  origin: 'http://localhost:3000', // Allow requests from your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, cors); // Apply CORS middleware

  await connectMongo();

  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const products = await Product.find({ userId });
        const formattedProducts = products.map((product) => ({
          id: product._id, // Map MongoDB _id to id
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          stock: product.stock,
          image: product.imageUrl,
        }));
        return res.status(200).json(formattedProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        return res.status(500).json({
          error: 'Failed to fetch products',
          message: (error as Error).message,
        });
      }

    case 'POST':
      try {
        const { name, description, price, category, stock, imageUrl } = req.body;
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
        return res.status(500).json({
          error: 'Failed to create product',
          message: (error as Error).message,
        });
      }

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}