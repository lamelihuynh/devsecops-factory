import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="tabs tabs-boxed bg-transparent p-2 m-2">
      <button
        onClick={() => setActiveTab("chats")}
        className={`tab ${activeTab === "chats"
          ? "bg-amber-500/20 text-amber-400"
          : "text-zinc-400"
          }`}
      >
        Chats
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        className={`tab ${activeTab === "contacts"
          ? "bg-amber-500/20 text-amber-400"
          : "text-zinc-400"
          }`}
      >
        Contacts
      </button>
    </div>
  );
}
export default ActiveTabSwitch;
