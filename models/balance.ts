import mongoose, { Schema, Document } from 'mongoose';

export interface Balance extends Document {
  userId: string; // Clerk user ID
  balance: number; // Current balance
  lastUpdated: Date; // Last update timestamp
  history?: Array<{
    change: number; // Amount added or subtracted
    reason?: string; // Reason for the change
    timestamp: Date; // When the change occurred
  }>;
}

const BalanceSchema = new Schema<Balance>({
  userId: { type: String, required: true, unique: true }, // Clerk user ID
  balance: { type: Number, default: 0 }, // Default balance is 0
  lastUpdated: { type: Date, default: Date.now }, // Automatically set to current time
  history: [
    {
      change: { type: Number },
      reason: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const BalanceModel = mongoose.models.Balance || mongoose.model<Balance>('Balance', BalanceSchema);

export default BalanceModel;