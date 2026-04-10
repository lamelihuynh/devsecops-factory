import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { Bot } from "lucide-react";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } =
    useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className={`${contact.isAI
              ? "bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20"
              : "bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20"
            } p-4 rounded-lg cursor-pointer transition-all`}
          onClick={() => setSelectedUser(contact)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`avatar ${onlineUsers.includes(contact._id) || contact.isAI ? "online" : "offline"}`}
            >
              <div className="size-12 rounded-full relative">
                <img
                  src={contact.profilePic || "/avatar.png"}
                  alt={
                    contact.fullName
                      ? `${contact.fullName} avatar`
                      : "User avatar"
                  }
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-zinc-200 font-medium">{contact.fullName}</h4>
                {contact.isAI && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/30 text-amber-300 rounded-full">
                    AI
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export default ContactList;
