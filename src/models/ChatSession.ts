import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSessionDocument extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  userId: mongoose.Types.ObjectId;
  messages: ChatMessage[];
  businessContextId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ChatSessionSchema = models.ChatSession?.schema || new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [ChatMessageSchema],
  businessContextId: { type: Schema.Types.ObjectId, ref: 'BusinessContext' },
  isActive: { type: Boolean, default: true },
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

ChatSessionSchema.virtual('id').get(function(this: ChatSessionDocument) {
  return this._id.toHexString();
});

ChatSessionSchema.pre('save', function(this: ChatSessionDocument) {
  this.updatedAt = new Date();
});

const ChatSessionModel = models.ChatSession || model<ChatSessionDocument>('ChatSession', ChatSessionSchema);

export default ChatSessionModel as mongoose.Model<ChatSessionDocument>;