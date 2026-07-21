import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, sparse: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    expoPushTokens: [{ type: String }],
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
