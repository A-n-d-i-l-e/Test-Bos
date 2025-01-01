import mongoose, { Schema, Document } from 'mongoose';

interface Transaction extends Document {
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  value: number;
  currency: 'ETH' | 'USDC' | 'DAI';
  status: 'pending' | 'confirmed' | 'failed';
  blockTimestamp: Date;
  blockNumber: number;
  userId: string;
  productId: Schema.Types.ObjectId;
  productDetails: {
    name: string;
    description: string;
    price: number;
    quantity: number;
  };
}

const TransactionSchema = new Schema<Transaction>({
  transactionHash: { type: String, required: true },
  fromAddress: { type: String, required: true },
  toAddress: { type: String, required: true },
  value: { type: Number, required: true },
  currency: { type: String, enum: ['ETH', 'USDC', 'DAI'], required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], required: true },
  blockTimestamp: { type: Date, required: true },
  blockNumber: { type: Number, required: true },
  userId: { type: String, required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productDetails: {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
});

export default mongoose.model<Transaction>('Transaction', TransactionSchema);