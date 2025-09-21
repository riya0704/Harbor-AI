import mongoose, { Schema, Document, models, model } from 'mongoose';
import type { Post as PostType } from '@/lib/types';

const PostSchema = new Schema({
  date: { type: Date, required: true },
  platforms: [{ type: String, required: true }],
  content: { type: String, required: true },
  image: { type: String },
  video: { type: String },
  status: { type: String, required: true },
  type: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
});

export interface PostDocument extends Omit<PostType, 'id' | 'date'>, Document {
  id: string;
  date: Date;
}

const PostModel = models.Post || model<PostDocument>('Post', PostSchema);

export default PostModel as mongoose.Model<PostDocument>;