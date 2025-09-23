import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface BusinessContextDocument extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  userId: mongoose.Types.ObjectId;
  businessName: string;
  industry: string;
  targetAudience: string;
  brandVoice: string;
  keyTopics: string[];
  contentPreferences: {
    tone: string;
    style: string;
    persona: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BusinessContextSchema = models.BusinessContext?.schema || new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  industry: { type: String, required: true },
  targetAudience: { type: String, required: true },
  brandVoice: { type: String, required: true },
  keyTopics: [{ type: String }],
  contentPreferences: {
    tone: { type: String, required: true },
    style: { type: String, required: true },
    persona: { type: String, required: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
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
  }
});

BusinessContextSchema.virtual('id').get(function(this: BusinessContextDocument) {
  return this._id.toHexString();
});

BusinessContextSchema.pre('save', function(this: BusinessContextDocument) {
  this.updatedAt = new Date();
});

const BusinessContextModel = models.BusinessContext || model<BusinessContextDocument>('BusinessContext', BusinessContextSchema);

export default BusinessContextModel as mongoose.Model<BusinessContextDocument>;