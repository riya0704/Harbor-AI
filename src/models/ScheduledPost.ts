import mongoose, { Schema, Document, models, model } from 'mongoose';
import { SocialPlatform } from '@/lib/types';

export interface PublishResult {
  platform: SocialPlatform;
  success: boolean;
  publishedId?: string;
  error?: string;
  publishedAt?: Date;
}

export interface ScheduledPostDocument extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  scheduledTime: Date;
  platforms: SocialPlatform[];
  status: 'pending' | 'processing' | 'published' | 'failed' | 'cancelled';
  publishResults: PublishResult[];
  retryCount: number;
  createdAt: Date;
}

const PublishResultSchema = new Schema({
  platform: { type: String, enum: ['Twitter', 'LinkedIn', 'Instagram'], required: true },
  success: { type: Boolean, required: true },
  publishedId: { type: String },
  error: { type: String },
  publishedAt: { type: Date }
}, { _id: false });

const ScheduledPostSchema = models.ScheduledPost?.schema || new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  scheduledTime: { type: Date, required: true },
  platforms: [{ type: String, enum: ['Twitter', 'LinkedIn', 'Instagram'], required: true }],
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'published', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  publishResults: [PublishResultSchema],
  retryCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
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
  }
});

ScheduledPostSchema.virtual('id').get(function(this: ScheduledPostDocument) {
  return this._id.toHexString();
});

// Index for efficient querying of scheduled posts
ScheduledPostSchema.index({ scheduledTime: 1, status: 1 });
ScheduledPostSchema.index({ userId: 1, scheduledTime: 1 });

const ScheduledPostModel = models.ScheduledPost || model<ScheduledPostDocument>('ScheduledPost', ScheduledPostSchema);

export default ScheduledPostModel as mongoose.Model<ScheduledPostDocument>;