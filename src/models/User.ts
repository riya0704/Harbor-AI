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
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// To ensure we don't re-create the model if it already exists, especially in dev with HMR
const UserModel = models.User || model<UserDocument>('User', UserSchema);

export default UserModel as mongoose.Model<UserDocument>;