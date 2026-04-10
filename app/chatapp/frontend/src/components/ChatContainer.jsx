import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    // clean up
    return () => unsubscribeFromMessages();
  }, [
    selectedUser,
    getMessagesByUserId,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  return (
    <>
      <ChatHeader />
      <div className="flex-1 px-6 overflow-y-auto py-8">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
              // Defensive check: skip rendering if authUser is not loaded
              if (!authUser) return null;

              // Handle both populated senderId (group messages) and string ID (regular messages)
              const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
              const isMyMessage = senderId === authUser._id;

              // Check if this is a group chat
              const isGroupChat = selectedUser?.members !== undefined;

              // Get sender name for group messages
              const senderName = typeof msg.senderId === 'object' ? msg.senderId.fullName : null;

              return (
                <div
                  key={msg._id}
                  className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}
                >
                  {/* Show sender name for group messages from others */}
                  {isGroupChat && !isMyMessage && senderName && (
                    <div className="chat-header text-xs text-zinc-400 mb-1 font-medium">
                      {senderName}
                    </div>
                  )}

                  <div
                    className={`chat-bubble relative ${isMyMessage
                      ? "bg-amber-600 text-white"
                      : "bg-zinc-900 text-zinc-200"
                      }`}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Shared"
                        className="rounded-lg h-48 object-cover"
                      />
                    )}
                    {msg.text && <p className="mt-2">{msg.text}</p>}
                    <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            {/* scroll target */}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      <MessageInput />
    </>
  );
}

export default ChatContainer;
