import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      maxlength: 15,
    },
    password: {
      type: String,
      required: function () {
        return !this.isAI; // Password not required for AI users
      },
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    isAI: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
); //createdAt, updatedAt shows time authenticated and modified

const User = mongoose.model("User", userSchema);

export default User;
