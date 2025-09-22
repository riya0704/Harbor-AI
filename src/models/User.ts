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
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash; // Ensure hash is not sent in JSON response
    }
  },
  toObject: {
    virtuals: true,
     transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash; // Ensure hash is not exposed in objects
    }
  }
});

const UserModel = models.User || model<UserDocument>('User', UserSchema);

export default UserModel as mongoose.Model<UserDocument>;
