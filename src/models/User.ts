import {Types, Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId; // <-- Add this line
  email: string;
  name?: string;
  googleId?: string;
  isVerified: boolean;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  googleId: { type: String },
  isVerified: { type: Boolean, default: false },
});

export const User = model<IUser>('User', userSchema);