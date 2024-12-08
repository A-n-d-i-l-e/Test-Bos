import mongoose, { Document, Schema } from 'mongoose';

export interface Product extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  userId: string;
}

const ProductSchema: Schema<Product> = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be a positive number'],
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true,
  },
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Stock must be a non-negative number'],
    default: 0,
  },
  imageUrl: {
    type: String,
    required: false,
    trim: true,
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
  }
}, {
  timestamps: true,
});

const ProductModel = mongoose.models.Product || mongoose.model<Product>('Product', ProductSchema);

export default ProductModel;