import mongoose, { Schema, Document, models, model } from 'mongoose';
import type { SocialAccount as SocialAccountType } from '@/lib/types';

export interface SocialAccountDocument extends Omit<SocialAccountType, 'id'>, Document {
  id: string; // virtual getter
  userId: mongoose.Types.ObjectId;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

const SocialAccountSchema = new Schema<SocialAccountDocument>({
  platform: { type: String, required: true },
  username: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
});


SocialAccountSchema.virtual('id').get(function() {
  return this._id.toHexString();
});


// Ensure virtuals are included
SocialAccountSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  }
});

SocialAccountSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  }
});


const SocialAccountModel = models.SocialAccount || model<SocialAccountDocument>('SocialAccount', SocialAccountSchema);

export default SocialAccountModel as mongoose.Model<SocialAccountDocument>;
