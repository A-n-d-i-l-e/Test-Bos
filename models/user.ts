import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  clerkId: string;
  createdAt: Date;  // Automatically handled by timestamps
  updatedAt: Date;  // Automatically handled by timestamps
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },  // User's email address
    username: { type: String, required: true },  // User's chosen username
    firstName: { type: String, required: true },  // User's first name
    lastName: { type: String, required: true },  // User's last name
    clerkId: { type: String, required: true },  // Clerk authentication ID for the user
  },
  { timestamps: true }  // Automatically adds createdAt and updatedAt fields
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);