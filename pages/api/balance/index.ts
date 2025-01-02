import { NextApiRequest, NextApiResponse } from 'next';
import connectMongo from '@/lib/mongodb';
import Balance from '@/models/balance';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing Clerk session' });
  }

  try {
    if (req.method === 'GET') {
      // Fetch balance for the authenticated user
      const balance = await Balance.findOne({ userId: clerkUserId });
      if (!balance) {
        return res.status(404).json({ message: 'Balance not found' });
      }
      return res.status(200).json(balance);
    }

    if (req.method === 'POST') {
      const { change, reason } = req.body;

      if (typeof change !== 'number') {
        return res.status(400).json({ message: 'Invalid or missing "change" field' });
      }

      // Find or create the user's balance
      let balance = await Balance.findOne({ userId: clerkUserId });

      if (!balance) {
        balance = new Balance({
          userId: clerkUserId,
          balance: change, // Initial balance set to the change value
          lastUpdated: new Date(),
          history: [{ change, reason, timestamp: new Date() }],
        });
      } else {
        // Update the existing balance
        balance.balance += change;
        balance.lastUpdated = new Date();
        balance.history.push({ change, reason, timestamp: new Date() });
      }

      await balance.save();
      return res.status(200).json(balance);
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Error handling balance:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}