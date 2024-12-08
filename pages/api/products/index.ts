import { NextApiRequest, NextApiResponse } from 'next';
import Product from '@/models/products';
import connectMongo from '../../../lib/mongodb';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  const { userId, orgId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const query = orgId ? { orgId } : { userId }; // Fetch by org or individual user
        const products = await Product.find(query);
        return res.status(200).json(products);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        return res.status(500).json({ error: 'Failed to fetch products', message: (error as Error).message });
      }

    case 'POST':
      try {
        const { name, description, price, category, stock, imageUrl } = req.body;

        // Create a new product with user and organization details
        const newProduct = new Product({
          name,
          description,
          price,
          category,
          stock,
          imageUrl,
          userId,
          orgId, // Include orgId for multi-tenancy support
        });

        await newProduct.save();
        console.log('Product created successfully:', newProduct);
        return res.status(201).json(newProduct);
      } catch (error) {
        console.error('Failed to create product:', error);
        return res.status(500).json({ error: 'Failed to create product', message: (error as Error).message });
      }

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}