import { X, Search, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

function GroupCreationModal() {
    const { isGroupModalOpen, setGroupModalOpen, allContacts, createGroup, getAllContacts } = useChatStore();
    const { authUser } = useAuthStore();
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Load contacts when modal opens
    useEffect(() => {
        if (isGroupModalOpen && allContacts.length === 0) {
            getAllContacts();
        }
    }, [isGroupModalOpen, allContacts.length, getAllContacts]);

    if (!isGroupModalOpen) return null;

    const handleClose = () => {
        setGroupModalOpen(false);
        setGroupName("");
        setSelectedMembers([]);
        setSearchQuery("");
    };

    const toggleMember = (userId) => {
        setSelectedMembers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!groupName.trim()) {
            return;
        }

        if (selectedMembers.length < 2) {
            return;
        }

        setIsCreating(true);
        try {
            // Include current user in members
            const memberIds = [authUser._id, ...selectedMembers];
            await createGroup({
                name: groupName.trim(),
                memberIds: memberIds,
            });
            handleClose();
        } catch (error) {
            console.error("Failed to create group:", error);
        } finally {
            setIsCreating(false);
        }
    };

    // Filter contacts: exclude QuackAI and the logged-in user
    const availableContacts = allContacts.filter(
        (contact) => !contact.isAI && contact._id !== authUser._id
    );

    // Filter by search query
    const filteredContacts = availableContacts.filter((contact) =>
        contact.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800/50 w-full max-w-md mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
                    <div className="flex items-center gap-2">
                        <Users className="size-5 text-amber-400" />
                        <h2 className="text-lg font-semibold text-zinc-200">
                            Create Group Chat
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Group Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Group Name
                        </label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name..."
                            className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                            maxLength={15}
                        />
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search contacts..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                        />
                    </div>

                    {/* Selected Count */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">
                            {selectedMembers.length + 1} members selected (including you)
                        </span>
                        {selectedMembers.length < 2 && (
                            <span className="text-amber-400 text-xs">
                                Select at least 2 more
                            </span>
                        )}
                    </div>

                    {/* Contact List */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {filteredContacts.map((contact) => (
                            <div
                                key={contact._id}
                                onClick={() => toggleMember(contact._id)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedMembers.includes(contact._id)
                                    ? "bg-amber-500/20 border border-amber-500/30"
                                    : "bg-zinc-800/30 hover:bg-zinc-800/50"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.includes(contact._id)}
                                        onChange={() => { }}
                                        className="size-4 accent-amber-500"
                                    />
                                    <div className="avatar">
                                        <div className="size-10 rounded-full">
                                            <img
                                                src={contact.profilePic || "/avatar.png"}
                                                alt={contact.fullName}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-zinc-200 font-medium">
                                            {contact.fullName}
                                        </h4>
                                        {contact.isAI && (
                                            <span className="text-xs text-amber-400">AI Assistant</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredContacts.length === 0 && (
                            <p className="text-center text-zinc-500 py-8">No contacts found</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t border-zinc-800/50">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selectedMembers.length < 2 || isCreating}
                        className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? "Creating..." : "Create Group"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GroupCreationModal;
