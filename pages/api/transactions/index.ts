import { NextApiRequest, NextApiResponse } from 'next';
import connectMongo from '@/lib/mongodb';
import Transaction from '@/models/transaction';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  // Validate Clerk session
  const { userId: clerkUserId } = getAuth(req);
  if (!clerkUserId) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing Clerk session' });
  }

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
        !blockNumber
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
        userId: clerkUserId, // Use Clerk's authenticated userId
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