import mongoose, { Schema, Document, models, model } from 'mongoose';
import { Post as PostType } from '@/lib/types';

export interface PostDocument extends Omit<PostType, 'id'>, Document {
  id: string; 
  userId: mongoose.Types.ObjectId;
}

const PostSchema = new Schema<PostDocument>({
  date: { type: Date, required: true },
  platforms: [{ type: String, required: true }],
  content: { type: String, required: true },
  image: { type: String },
  video: { type: String },
  status: { type: String, required: true, enum: ['draft', 'scheduled', 'published', 'error'] },
  type: { type: String, required: true, enum: ['dynamic', 'static'] },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
    }
  }
});

PostSchema.virtual('id').get(function() {
  return this._id.toHexString();
});


const PostModel = models.Post || model<PostDocument>('Post', PostSchema);

export default PostModel as mongoose.Model<PostDocument>;
