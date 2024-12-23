import { NextApiRequest, NextApiResponse } from 'next';
import { clerkClient } from '@clerk/nextjs/server';
import connectMongo from '../../../lib/mongodb';
import { User } from '../../../models/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      try {
        const user = await User.findById(id);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
      } catch (error) {
        res.status(400).json({ error: 'Failed to retrieve user' });
      }
      break;

    case 'PUT':
      try {
        const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedUser) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(updatedUser);
      } catch (error) {
        res.status(400).json({ error: 'Failed to update user' });
      }
      break;

    case 'DELETE':
      try {
        const { userId } = req.body; // Assuming userId is sent in the request body
        if (!userId) {
          return res.status(400).json({ error: 'User ID not provided' });
        }

        // Step 1: Delete the user from Clerk
        await clerkClient.users.deleteUser(userId);
        console.log('User deleted from Clerk successfully');

        // Step 2: Delete the user from MongoDB
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
          return res.status(404).json({ error: 'User not found in database' });
        }

        res.status(200).json({ message: 'User deleted from Clerk and database' });
      } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}