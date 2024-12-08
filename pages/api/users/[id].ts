import { NextApiRequest, NextApiResponse } from 'next';
import { clerkClient, getAuth } from '@clerk/nextjs/server';
import connectMongo from '../../../lib/mongodb';
import { User } from '../../../models/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectMongo();

    const { method } = req;
    const id = req.query.id as string; // Type assertion to ensure `id` is a string

    // Validate ID
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch authenticated user details
    const { userId, orgId, orgRole } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. User is not authenticated.' });
    }

    // Check if user is an admin
    const isAdmin = orgRole === 'admin';

    switch (method) {
      case 'GET':
        return await handleGet(req, res, id, orgId || '', isAdmin);

      case 'PUT':
        return await handlePut(req, res, id, orgId || '', isAdmin);

      case 'DELETE':
        return await handleDelete(req, res, id, orgId || '', isAdmin);

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
async function handleGet(req: NextApiRequest, res: NextApiResponse, id: string, orgId: string, isAdmin: boolean) {
  try {
    const user = await User.findById(id);

    if (!isAdmin && user?.orgId !== orgId) {
      return res.status(403).json({ error: 'Access denied. User does not belong to this organization.' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Failed to retrieve user:', error);
    return res.status(400).json({ error: 'Failed to retrieve user' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, id: string, orgId: string, isAdmin: boolean) {
  try {
    const user = await User.findById(id);

    if (!isAdmin && user?.orgId !== orgId) {
      return res.status(403).json({ error: 'Access denied. User does not belong to this organization.' });
    }

    const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    return res.status(400).json({ error: 'Failed to update user' });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, id: string, orgId: string, isAdmin: boolean) {
  try {
    const { clerkUserId } = req.body;

    if (!clerkUserId) {
      return res.status(400).json({ error: 'Clerk User ID is required' });
    }

    const user = await User.findById(id);

    if (!isAdmin && user?.orgId !== orgId) {
      return res.status(403).json({ error: 'Access denied. User does not belong to this organization.' });
    }

    await clerkClient.users.deleteUser(clerkUserId);

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}