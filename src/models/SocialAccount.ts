import mongoose, { Schema, Document, models, model } from 'mongoose';
import type { SocialAccount as SocialAccountType } from '@/lib/types';

const SocialAccountSchema = new Schema({
  platform: { type: String, required: true },
  username: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  // Assuming a simple association with a user for now
  userId: { type: String, required: true, default: 'user1' },
});

export interface SocialAccountDocument extends Omit<SocialAccountType, 'id'>, Document {
  id: string;
}

const SocialAccountModel = models.SocialAccount || model<SocialAccountDocument>('SocialAccount', SocialAccountSchema);

export default SocialAccountModel as mongoose.Model<SocialAccountDocument>;
