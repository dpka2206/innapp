import mongoose from 'mongoose';

const reminderLogSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, unique: true },
    sentAt: { type: Date, default: Date.now },
    channels: [{ type: String }],
  },
  { timestamps: true }
);

export const ReminderLog = mongoose.model('ReminderLog', reminderLogSchema);
