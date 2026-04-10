import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { Bot, Users } from "lucide-react";

function ChatsList() {
  const { getMyChatPartners, getUserGroups, chats, groups, isUsersLoading, setSelectedUser } =
    useChatStore();
  const { onlineUsers, socket } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
    getUserGroups();

    // Subscribe to real-time group updates
    if (socket) {
      socket.on("newGroup", (group) => {
        console.log("New group received:", group);
        // Add new group to the groups array (avoid duplicates)
        useChatStore.setState((state) => {
          // Check if group already exists
          const groupExists = state.groups.some((g) => g._id === group._id);
          if (groupExists) {
            return state; // Don't add duplicate
          }
          return {
            groups: [group, ...state.groups],
          };
        });
      });
    }

    return () => {
      if (socket) {
        socket.off("newGroup");
      }
    };
  }, [getMyChatPartners, getUserGroups, socket]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0 && groups.length === 0) return <NoChatsFound />;

  return (
    <>
      {chats.map((chat) => (
        <div
          key={chat._id}
          className={`${chat.isAI
            ? "bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20"
            : "bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20"
            } p-4 rounded-lg cursor-pointer transition-all`}
          onClick={() => setSelectedUser(chat)}
        >
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="size-12 rounded-full relative">
                <img
                  src={chat.profilePic || "/avatar.png"}
                  alt={chat.fullName}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-zinc-200 font-medium truncate">
                  {chat.fullName}
                </h4>
                {chat.isAI && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/30 text-amber-300 rounded-full">
                    AI
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Groups */}
      {groups.map((group) => (
        <div
          key={group._id}
          className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg cursor-pointer hover:bg-blue-500/20 transition-all"
          onClick={() => setSelectedUser(group)}
        >
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="size-12 rounded-full relative bg-blue-500/20 flex items-center justify-center">
                {group.avatar ? (
                  <img src={group.avatar} alt={group.name} className="rounded-full" />
                ) : (
                  <Users className="size-6 text-blue-400" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-zinc-200 font-medium truncate">
                  {group.name}
                </h4>
              </div>
              <p className="text-zinc-500 text-sm">
                {group.members?.length || 0} members
              </p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export default ChatsList;
