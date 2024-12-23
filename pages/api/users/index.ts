import type { NextApiRequest, NextApiResponse } from 'next';
import connectMongo from '../../../lib/mongodb';
import { User } from '../../../models/user';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectMongo();
    console.log("Request headers:", req.headers);

    const { userId } = getAuth(req);
    console.log("User ID from Clerk:", userId);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      return await handlePost(req, res, userId);
    } else if (req.method === 'GET') {
      return await handleGet(req, res);
    } else {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ message: 'An unexpected error occurred' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { email, username, firstName, lastName } = req.body;
    console.log("Request body:", req.body);

    if (!email || !username || !firstName || !lastName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newUser = new User({
      email,
      username,
      firstName,
      lastName,
      clerkId: userId,
    });
    
    await newUser.save();
    console.log("New user created:", newUser);

    return res.status(201).json({ message: 'User created successfully', user: newUser });
    
  } catch (error) {
    // Define a specific type for error
    if (isMongoError(error) && error.code === 11000 && error.keyPattern?.email) {
      console.warn("Duplicate email error suppressed for email:", req.body.email);
      return res.status(200).json({ message: 'Duplicate email error suppressed' });
    } else {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: (error instanceof Error) ? error.message : 'An unknown error occurred while creating user' });
    }
  }
}

// Type guard for MongoDB error
function isMongoError(error: unknown): error is { code: number; keyPattern?: { [key: string]: number } } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const users = await User.find({}).select('-__v');
    console.log("Fetched users count:", users.length);
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: (error instanceof Error) ? error.message : 'An unknown error occurred while fetching users' });
  }
}