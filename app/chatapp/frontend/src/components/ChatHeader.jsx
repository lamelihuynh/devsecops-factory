import { XIcon, Bot, Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // Check if selected item is a group or user
  const isGroup = selectedUser?.members !== undefined;
  const isOnline = !isGroup && (onlineUsers.includes(selectedUser?._id) || selectedUser?.isAI);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div
      className="flex justify-between items-center bg-zinc-900/50 border-b
    border-zinc-800/50 max-h-[84px] px-6 flex-1"
    >
      <div className="flex items-center space-x-3">
        {isGroup ? (
          // Group Header
          <>
            <div className="avatar">
              <div className="w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt={selectedUser.name} className="rounded-full" />
                ) : (
                  <Users className="size-6 text-blue-400" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-zinc-200 font-medium">
                  {selectedUser.name}
                </h3>
                <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                  Group
                </span>
              </div>
              <p className="text-zinc-400 text-sm">
                {selectedUser.members?.length || 0} members
              </p>
            </div>
          </>
        ) : (
          // Individual User Header
          <>
            <div className={`avatar ${isOnline ? "online" : "offline"}`}>
              <div className="w-12 rounded-full relative">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt={selectedUser.fullName}
                />
                {selectedUser.isAI && (
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1">
                    <Bot className="size-3 text-white" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-zinc-200 font-medium">
                  {selectedUser.fullName}
                </h3>
                {selectedUser.isAI && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/30 text-amber-300 rounded-full">
                    AI
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-sm">
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </>
        )}
      </div>

      <button onClick={() => setSelectedUser(null)}>
        <XIcon className="w-5 h-5 text-zinc-400 hover:text-slate-200 transition-colors cursor-pointer" />
      </button>
    </div>
  );
}
export default ChatHeader;
