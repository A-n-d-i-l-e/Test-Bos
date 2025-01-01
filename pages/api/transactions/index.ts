import { NextApiRequest, NextApiResponse } from 'next';
import connectMongo from '@/lib/mongodb';
import Product from '@/models/products';
import Transaction from '@/models/transaction';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  if (req.method === 'POST') {
    try {
      const { productId, transactionHash, fromAddress, toAddress, value, currency, status, blockTimestamp, blockNumber, merchantId, quantity } = req.body;

      // Fetch product details
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Calculate total price
      const totalValue = product.price * quantity;

      // Create the transaction
      const transaction = new Transaction({
        transactionHash,
        fromAddress,
        toAddress,
        value: totalValue,
        currency,
        status,
        blockTimestamp,
        blockNumber,
        merchantId,
        productId,
        productDetails: {
          name: product.name,
          description: product.description,
          price: product.price,
          quantity,
        },
      });

      await transaction.save();

      return res.status(201).json(transaction);
    } catch (error) {
      console.error('Failed to create transaction:', error);
      return res.status(500).json({ error: 'Failed to create transaction' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}