import mongoose, { Schema, Document } from 'mongoose';

export interface Transaction extends Document {
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  value: number;
  currency: 'ETH' | 'USDC' | 'DAI';
  status: 'pending' | 'confirmed' | 'failed';
  blockTimestamp: Date;
  blockNumber: number;
  userId: string;
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
});

const TransactionModel = mongoose.models.Transaction || mongoose.model<Transaction>('Transaction', TransactionSchema);

export default TransactionModel;