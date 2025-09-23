import mongoose, { Schema, Document, models, model } from 'mongoose';
import { Post as PostType } from '@/lib/types';

export interface PostDocument extends Omit<PostType, 'id'>, Document {
  id: string; 
  userId: mongoose.Types.ObjectId;
}

const PostSchema = models.Post?.schema || new Schema<PostDocument>({
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

PostSchema.virtual('id').get(function(this: PostDocument) {
  return this._id.toHexString();
});


const PostModel = models.Post || model<PostDocument>('Post', PostSchema);

export default PostModel as mongoose.Model<PostDocument>;
