import { clerkClient } from '@clerk/nextjs/server';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    try {
      const { userId } = req.body; // Ensure this is coming from the body of the request
      console.log('Attempting to delete user with ID:', userId);

      if (!userId) {
        return res.status(400).json({ error: 'User ID not provided' });
      }

      await clerkClient.users.deleteUser(userId);
      console.log('User deleted successfully');
      return res.status(200).json({ message: 'User deleted' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}