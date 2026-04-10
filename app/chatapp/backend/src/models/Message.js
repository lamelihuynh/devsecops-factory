import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        // receiverId is required only if groupId is not provided
        return !this.groupId;
      },
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: function () {
        // groupId is required only if receiverId is not provided
        return !this.receiverId;
      },
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ groupId: 1, createdAt: -1 });

messageSchema.pre("validate", function (next) {
  const hasReceiver = Boolean(this.receiverId);
  const hasGroup = Boolean(this.groupId);
  if (hasReceiver === hasGroup) {
    this.invalidate("receiverId", "Provide either receiverId or groupId");
    this.invalidate("groupId", "Provide either receiverId or groupId");
  }
  next();
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
