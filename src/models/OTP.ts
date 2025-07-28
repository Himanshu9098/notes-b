import { Schema, model, Document, Types } from 'mongoose';

interface IOTP extends Document {
  userId: Types.ObjectId;
  otp: string;
  expiresAt: Date;
}

const otpSchema = new Schema<IOTP>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: '10m' } },
});

export const OTP = model<IOTP>('OTP', otpSchema);