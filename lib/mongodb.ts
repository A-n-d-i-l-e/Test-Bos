import mongoose from 'mongoose';

const connectMongo = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) return;

  await mongoose.connect(process.env.MONGO_DB_URL as string);
};

export default connectMongo;