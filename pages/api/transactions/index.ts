import { NextApiRequest, NextApiResponse } from 'next';
import connectMongo from '@/lib/mongodb';
import Transaction from '@/models/transaction';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  if (req.method === 'POST') {
    try {
      const {
        transactionHash,
        fromAddress,
        toAddress,
        value,
        currency,
        status,
        blockTimestamp,
        blockNumber,
        userId,
      } = req.body;

      // Ensure all required fields are present
      if (
        !transactionHash ||
        !fromAddress ||
        !toAddress ||
        !value ||
        !currency ||
        !status ||
        !blockTimestamp ||
        !blockNumber ||
        !userId
      ) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Create the transaction
      const transaction = new Transaction({
        transactionHash,
        fromAddress,
        toAddress,
        value,
        currency,
        status,
        blockTimestamp,
        blockNumber,
        userId,
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