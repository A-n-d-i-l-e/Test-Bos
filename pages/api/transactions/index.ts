import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "@/lib/mongodb";
import Transaction from "@/models/transaction";
import { getAuth } from "@clerk/nextjs/server";

// Utility function to set CORS headers
const setCorsHeaders = (req: NextApiRequest, res: NextApiResponse) => {
  const allowedOrigins = ["http://localhost:3000", "https://your-live-site.com"];
  const origin = req.headers.origin || "";

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    setCorsHeaders(req, res);
    return res.status(200).end("CORS preflight successful");
  }

  // Set CORS headers for all other requests
  setCorsHeaders(req, res);

  await connectMongo();

  // Validate Clerk session
  const { userId: clerkUserId } = getAuth(req);
  if (!clerkUserId) {
    return res.status(401).json({ message: "Unauthorized: Invalid or missing Clerk session" });
  }

  if (req.method === "GET") {
    try {
      // Fetch transactions for the authenticated user
      const transactions = await Transaction.find({ userId: clerkUserId }).sort({
        blockTimestamp: -1,
      });

      return res.status(200).json(transactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }
  }

  if (req.method === "POST") {
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

      // Validate request body
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
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check for existing transaction
      const existingTransaction = await Transaction.findOne({ transactionHash });
      if (existingTransaction) {
        return res.status(200).json({
          message: "Transaction already exists",
          transaction: existingTransaction,
        });
      }

      // Create a new transaction
      const transaction = new Transaction({
        transactionHash,
        fromAddress,
        toAddress,
        value,
        currency,
        status,
        blockTimestamp,
        blockNumber,
        userId: clerkUserId,
      });

      await transaction.save();
      return res.status(201).json(transaction);
    } catch (error) {
      console.error("Failed to create transaction:", { error, requestBody: req.body });
      return res.status(500).json({ error: "Failed to create transaction" });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}