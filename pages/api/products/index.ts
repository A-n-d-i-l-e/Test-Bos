import { NextApiRequest, NextApiResponse } from 'next';
import Product from '@/models/products';
import connectMongo from '../../../lib/mongodb';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  // Get the user from Clerk authentication
  const { userId } = getAuth(req);

 
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      try {
        // Fetch products associated with the authenticated user
        const products = await Product.find({ userId });
        return res.status(200).json(products);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        return res.status(500).json({ error: 'Failed to fetch products', message: (error as Error).message });
      }

    case 'POST':
      try {
        const { name, description, price, category, stock, imageUrl } = req.body;

        // Debugging: log the request body content
        console.log('Request body:', req.body);

        // Create a new product with the associated userId
        const newProduct = new Product({
          name,
          description,
          price,
          category,
          stock,
          imageUrl,
          userId,  // Attach the authenticated user's ID
        });

        await newProduct.save();
        console.log('Product created successfully:', newProduct);
        return res.status(201).json(newProduct);
      } catch (error) {
        console.error('Failed to create product:', error);  // Log the error
        return res.status(500).json({ error: 'Failed to create product', message: (error as Error).message });
      }

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}