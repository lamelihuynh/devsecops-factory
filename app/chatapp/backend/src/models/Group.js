import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 15,
        },
        avatar: {
            type: String,
            default: "https://res.cloudinary.com/drgv8fstg/image/upload/v1771162569/duck_1_jdes5h.png",
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

// Index for faster queries
groupSchema.index({ members: 1 });

const Group = mongoose.model("Group", groupSchema);

export default Group;
