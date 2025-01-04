import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "@/lib/mongodb";
import ProductModel from "@/models/products"; // Use the Product model
import { getAuth } from "@clerk/nextjs/server";

// Utility function to set CORS headers
const setCorsHeaders = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "https://bos-pay-client-portal.vercel.app"); // Adjust for your frontend origin
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  // Set CORS headers for all requests
  setCorsHeaders(res);

  // Connect to MongoDB
  try {
    await connectMongo();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return res.status(500).json({ message: "Failed to connect to MongoDB" });
  }

  // Validate Clerk session
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Invalid or missing Clerk session" });
  }

  switch (req.method) {
    case "GET": {
      try {
        // Fetch distinct categories for the authenticated user's products
        const categories = await ProductModel.distinct("category", { userId });
        return res.status(200).json(categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        return res.status(500).json({ error: "Failed to fetch categories" });
      }
    }

    case "POST": {
      try {
        const { name } = req.body;

        // Check if the category already exists in the user's products
        const existingCategory = await ProductModel.findOne({ category: name, userId });
        if (existingCategory) {
          return res.status(400).json({ error: "Category already exists" });
        }

        // Add a dummy product to create a new category
        const newCategory = new ProductModel({
          name: `Sample Product for ${name}`,
          description: `Sample description for ${name}`,
          price: 0,
          category: name,
          stock: 0,
          userId,
        });
        await newCategory.save();

        return res.status(201).json({ message: `Category '${name}' added successfully` });
      } catch (error) {
        console.error("Failed to add category:", error);
        return res.status(500).json({ error: "Failed to add category" });
      }
    }

    case "PUT": {
      try {
        const { id, name } = req.body;

        // Update the category name in all associated products
        const updatedProducts = await ProductModel.updateMany(
          { category: id, userId },
          { $set: { category: name } }
        );

        if (updatedProducts.matchedCount === 0) {
          return res.status(404).json({ error: "Category not found" });
        }

        return res.status(200).json({ message: `Category '${id}' updated to '${name}' successfully` });
      } catch (error) {
        console.error("Failed to update category:", error);
        return res.status(500).json({ error: "Failed to update category" });
      }
    }

    case "DELETE": {
      try {
        const { name } = req.body;

        // Remove all products for the category
        const deleted = await ProductModel.deleteMany({ category: name, userId });
        if (deleted.deletedCount === 0) {
          return res.status(404).json({ error: "Category not found" });
        }

        return res.status(200).json({ message: `Category '${name}' and its products deleted successfully` });
      } catch (error) {
        console.error("Failed to delete category:", error);
        return res.status(500).json({ error: "Failed to delete category" });
      }
    }

    default:
      return res.status(405).json({ message: "Method Not Allowed" });
  }
}
