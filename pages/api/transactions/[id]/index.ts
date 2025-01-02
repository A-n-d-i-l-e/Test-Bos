import { NextApiRequest, NextApiResponse } from 'next';
import connectMongo from '@/lib/mongodb';
import Transaction from '@/models/transaction';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  const { id } = req.query;
  const { userId: clerkUserId } = getAuth(req);

  // Validate Clerk session
  if (!clerkUserId) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing Clerk session' });
  }

  // Validate transaction ID
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid or missing transaction ID' });
  }

  try {
    if (req.method === 'GET') {
      // Fetch a transaction by ID
      const transaction = await Transaction.findById(id);

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      if (transaction.userId !== clerkUserId) {
        return res.status(403).json({ message: 'Forbidden: Access denied to this transaction' });
      }

      return res.status(200).json(transaction);
    }

    if (req.method === 'PUT') {
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

      const transaction = await Transaction.findById(id);

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      if (transaction.userId !== clerkUserId) {
        return res.status(403).json({ message: 'Forbidden: Access denied to this transaction' });
      }

      const updatedTransaction = await Transaction.findByIdAndUpdate(
        id,
        {
          transactionHash,
          fromAddress,
          toAddress,
          value,
          currency,
          status,
          blockTimestamp,
          blockNumber,
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json(updatedTransaction);
    }

    if (req.method === 'DELETE') {
      const transaction = await Transaction.findById(id);

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      if (transaction.userId !== clerkUserId) {
        return res.status(403).json({ message: 'Forbidden: Access denied to this transaction' });
      }

      await Transaction.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Transaction deleted successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Error handling transaction:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}