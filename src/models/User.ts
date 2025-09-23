import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  timezone: string;
  preferences: {
    defaultPostType: 'dynamic' | 'static';
    autoPublish: boolean;
    notifications: {
      email: boolean;
      postSuccess: boolean;
      postFailure: boolean;
    };
  };
  createdAt: Date;
}

const UserSchema = models.User?.schema || new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  timezone: { type: String, default: 'UTC' },
  preferences: {
    defaultPostType: { type: String, enum: ['dynamic', 'static'], default: 'dynamic' },
    autoPublish: { type: Boolean, default: false },
    notifications: {
      email: { type: Boolean, default: true },
      postSuccess: { type: Boolean, default: true },
      postFailure: { type: Boolean, default: true }
    }
  },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
  }
});

UserSchema.virtual('id').get(function(this: UserDocument) {
  return this._id.toHexString();
});

const UserModel = models.User || model<UserDocument>('User', UserSchema);

export default UserModel as mongoose.Model<UserDocument>;
