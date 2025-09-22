import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now },
}, {
  // This transform is used for toJSON and toObject
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    // The passwordHash is NOT deleted here. It is handled by `select: false` in the schema.
  },
  virtuals: true,
});

// Apply the transform to both toJSON and toObject
UserSchema.set('toJSON', { transform: UserSchema.get('transform') });
UserSchema.set('toObject', { transform: UserSchema.get('transform') });


const UserModel = models.User || model<UserDocument>('User', UserSchema);

export default UserModel as mongoose.Model<UserDocument>;
