
import mongoose, { Schema, Document, models, model } from 'mongoose';
import type { SocialAccount as SocialAccountType } from '@/lib/types';

export interface SocialAccountDocument extends Omit<SocialAccountType, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  userId: mongoose.Types.ObjectId;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

const SocialAccountSchema = new Schema({
  platform: { type: String, required: true },
  username: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // Fields for storing OAuth tokens from social platforms
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
});


// Ensure virtual 'id' is included in toObject and toJSON outputs
SocialAccountSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
  }
});
SocialAccountSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
  }
});


const SocialAccountModel = models.SocialAccount || model<SocialAccountDocument>('SocialAccount', SocialAccountSchema);

export default SocialAccountModel as mongoose.Model<SocialAccountDocument>;
