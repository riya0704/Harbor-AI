import mongoose, { Schema, Document, models, model } from 'mongoose';

// Note: Omit userId from PostType as it will be part of the Mongoose document via ref
export interface PostDocument extends Omit<import('@/lib/types').Post, 'id' | 'userId'>, Document {
  id: string;
  userId: mongoose.Types.ObjectId;
}

const PostSchema = new Schema({
  date: { type: Date, required: true },
  platforms: [{ type: String, required: true }],
  content: { type: String, required: true },
  image: { type: String },
  video: { type: String },
  status: { type: String, required: true, enum: ['draft', 'scheduled', 'published', 'error'] },
  type: { type: String, required: true, enum: ['dynamic', 'static'] },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
});

const PostModel = models.Post || model<PostDocument>('Post', PostSchema);

export default PostModel as mongoose.Model<PostDocument>;
