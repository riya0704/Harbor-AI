
import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface UserDocument extends Document {
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
});

// Ensure virtual 'id' is included in toObject and toJSON outputs
UserSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
  }
});
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.passwordHash;
  }
});


const UserModel = models.User || model<UserDocument>('User', UserSchema);

export default UserModel as mongoose.Model<UserDocument>;
