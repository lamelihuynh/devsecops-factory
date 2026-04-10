import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import Toolbar from "../components/Toolbar";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import GroupCreationModal from "../components/GroupCreationModal";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  const { subscribeToGlobalMessages, unsubscribeFromGlobalMessages } =
    useChatStore();

  useEffect(() => {
    // When there's no selected conversation, attach a global listener
    if (!selectedUser) {
      subscribeToGlobalMessages();
    } else {
      // ensure global listener is removed when a conversation opens
      unsubscribeFromGlobalMessages();
    }

    return () => {
      unsubscribeFromGlobalMessages();
    };
  }, [selectedUser, subscribeToGlobalMessages, unsubscribeFromGlobalMessages]);

  return (
    <div className="relative w-full max-w-6xl h-[800px]">
      <BorderAnimatedContainer>
        <div className="flex w-full h-full">
          {/* LEFT TOOLBAR */}
          <Toolbar />

          {/* SIDEBAR */}
          <div className="w-80 bg-zinc-900/50 backdrop-blur-sm flex flex-col">
            <ProfileHeader />
            <ActiveTabSwitch />

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeTab === "chats" ? <ChatsList /> : <ContactList />}
            </div>
          </div>

          {/* RIGHT SIDE - CHAT AREA */}
          <div className="flex-1 flex flex-col bg-zinc-950/50 backdrop-blur-sm">
            {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
          </div>
        </div>
      </BorderAnimatedContainer>

      {/* Group Creation Modal */}
      <GroupCreationModal />
    </div>
  );
}
export default ChatPage;
