import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = models.User?.schema || new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
    }
  },
  toObject: {
    virtuals: true,
  }
});

UserSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const UserModel = models.User || model<UserDocument>('User', UserSchema);

export default UserModel as mongoose.Model<UserDocument>;
