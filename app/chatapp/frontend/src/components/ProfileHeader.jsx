import { useState, useRef } from "react";
import { Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const { authUser, updateProfile } = useAuthStore();
  const { setGroupModalOpen } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleCreateGroup = () => {
    setGroupModalOpen(true);
  };

  return (
    <div className="p-3.5 border-b border-zinc-800/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* AVATAR */}
          <div className="avatar online">
            <button
              className="size-14 rounded-full overflow-hidden relative group"
              onClick={() => fileInputRef.current.click()}
            >
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="User image"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs">Change</span>
              </div>
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* USERNAME & ONLINE TEXT */}
          <div>
            <h3 className="text-zinc-200 font-medium text-base max-w-[180px] truncate">
              {authUser.fullName}
            </h3>

            <p className="text-zinc-400 text-xs">Online</p>
          </div>
        </div>

        {/* CREATE GROUP BUTTON */}
        <button
          className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
          onClick={() => {
            mouseClickSound.currentTime = 0;
            mouseClickSound
              .play()
              .catch((error) => console.log("Audio play failed:", error));
            handleCreateGroup();
          }}
          title="Create Group"
        >
          <Users className="size-5" />
          <span className="text-sm hidden sm:inline">Group</span>
        </button>
      </div>
    </div>
  );
}
export default ProfileHeader;
