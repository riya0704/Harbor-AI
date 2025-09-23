import mongoose, { Schema, Document, models, model } from 'mongoose';
import type { SocialAccount as SocialAccountType } from '@/lib/types';

export interface SocialAccountDocument extends Omit<SocialAccountType, 'id'>, Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

const SocialAccountSchema = models.SocialAccount?.schema || new Schema<SocialAccountDocument>({
  platform: { type: String, required: true },
  username: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
}, {
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});


SocialAccountSchema.virtual('id').get(function(this: SocialAccountDocument) {
  return this._id.toHexString();
});


const SocialAccountModel = models.SocialAccount || model<SocialAccountDocument>('SocialAccount', SocialAccountSchema);

export default SocialAccountModel as mongoose.Model<SocialAccountDocument>;
