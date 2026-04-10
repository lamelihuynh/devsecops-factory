import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Create a new group
export const createGroup = async (req, res) => {
    try {
        const { name, memberIds } = req.body;

        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Group name is required" });
        }

        if (!memberIds || memberIds.length < 2) {
            return res
                .status(400)
                .json({ message: "At least 3 members required (including yourself)" });
        }

        // Create members array (creator + selected members)
        const members = [...memberIds];
        const uniqueMembers = [...new Set(members.map((id) => id.toString()))];

        if (uniqueMembers.length < 3) {
            return res
                .status(400)
                .json({ message: "At least 3 members required" });
        }

        // Create group
        const group = new Group({
            name: name.trim(),
            members: uniqueMembers,
        });

        await group.save();

        // Populate members
        await group.populate("members", "-password");

        const creatorId = req.user._id.toString();

        // Emit to all members EXCEPT creator (they get it from API response)
        uniqueMembers.forEach((memberId) => {
            // Skip the creator
            if (memberId === creatorId) return;

            const socketIds = getReceiverSocketId(memberId);
            if (socketIds) {
                // socketIds is a Set, iterate over it
                socketIds.forEach((socketId) => {
                    io.to(socketId).emit("newGroup", group);
                });
            }
        });

        res.status(201).json(group);
    } catch (error) {
        console.error("Error in createGroup controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all groups where user is a member
export const getUserGroups = async (req, res) => {
    try {
        const userId = req.user._id;

        const groups = await Group.find({ members: userId })
            .populate("members", "-password")
            .sort({ updatedAt: -1 });

        res.status(200).json(groups);
    } catch (error) {
        console.error("Error in getUserGroups controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
