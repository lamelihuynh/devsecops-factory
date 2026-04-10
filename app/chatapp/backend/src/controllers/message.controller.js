import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { processAIMessage } from "./ai.controller.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (senderId.equals(receiverId)) {
      return res
        .status(400)
        .json({ message: "Cannot send messages to yourself." });
    }
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;
    if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketIds = getReceiverSocketId(receiverId);
    if (receiverSocketIds) {
      // Emit to all connected tabs/devices of the receiver
      receiverSocketIds.forEach((socketId) => {
        io.to(socketId).emit("newMessage", newMessage);
      });
    }

    // Check if receiver is QuackAI and trigger AI response
    if (receiver.isAI) {
      // Process AI response asynchronously (don't await)
      processAIMessage(newMessage, senderId).catch((err) =>
        console.error("AI response error:", err),
      );
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all direct messages (not group messages) where logged-in user is sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
      receiverId: { $exists: true }, // Only direct messages, not group messages
    });

    const chatPartnerIds = [
      ...new Set(
        messages
          .filter((msg) => msg.receiverId) // Extra safety check
          .map((msg) =>
            msg.senderId.toString() === loggedInUserId.toString()
              ? msg.receiverId.toString()
              : msg.senderId.toString(),
          ),
      ),
    ];

    const chatPartners = await User.find({
      _id: { $in: chatPartnerIds },
    }).select("-password");

    // Always include QuackAI at the top of chat list
    const quackAI = await User.findOne({ isAI: true }).select("-password");

    if (quackAI) {
      // Remove QuackAI if already in list, then add it to the beginning
      const filteredPartners = chatPartners.filter(
        (partner) => partner._id.toString() !== quackAI._id.toString(),
      );
      res.status(200).json([quackAI, ...filteredPartners]);
    } else {
      res.status(200).json(chatPartners);
    }
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send message to group
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    const Group = (await import("../models/Group.js")).default;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (
      !group.members.some(
        (memberId) => memberId.toString() === senderId.toString(),
      )
    ) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      image: imageUrl,
    });

    await newMessage.save();
    await newMessage.populate("senderId", "fullName profilePic");

    // Broadcast to all OTHER group members (exclude sender to prevent duplication)
    // Sender receives the message via HTTP response instead
    group.members.forEach((memberId) => {
      if (memberId.toString() !== senderId.toString()) {
        const memberSocketIds = getReceiverSocketId(memberId.toString());
        if (memberSocketIds) {
          // memberSocketIds is a Set, iterate over it
          memberSocketIds.forEach((socketId) => {
            io.to(socketId).emit("newMessage", newMessage);
          });
        }
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get messages for a group
export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const Group = (await import("../models/Group.js")).default;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (
      !group.members.some(
        (memberId) => memberId.toString() === userId.toString(),
      )
    ) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    const messages = await Message.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
