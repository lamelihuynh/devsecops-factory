import { LogOutIcon, VolumeOffIcon, Volume2Icon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function Toolbar() {
    const { logout } = useAuthStore();
    const { isSoundEnabled, toggleSound } = useChatStore();

    return (
        <div className="w-16 bg-zinc-900/80 backdrop-blur-sm border-r border-zinc-800/50 flex flex-col">
            {/* Empty space at top */}
            <div className="flex-1"></div>

            {/* Buttons at bottom */}
            <div className="flex flex-col gap-4 items-center pb-6">
                {/* Sound toggle button */}
                <button
                    className="text-zinc-400 hover:text-amber-400 transition-colors p-2 rounded-lg hover:bg-amber-500/10"
                    onClick={() => {
                        if (isSoundEnabled) {
                            mouseClickSound.currentTime = 0;
                            mouseClickSound
                                .play()
                                .catch((error) => console.log("Audio play failed:", error));
                        }
                        toggleSound();
                    }}
                    title={isSoundEnabled ? "Disable sound" : "Enable sound"}
                >
                    {isSoundEnabled ? (
                        <Volume2Icon className="size-5" />
                    ) : (
                        <VolumeOffIcon className="size-5" />
                    )}
                </button>

                {/* Logout button */}
                <button
                    className="text-zinc-400 hover:text-amber-400 transition-colors p-2 rounded-lg hover:bg-amber-500/10"
                    onClick={() => {
                        if (isSoundEnabled) {
                            mouseClickSound.currentTime = 0;
                            mouseClickSound
                                .play()
                                .catch((error) => console.log("Audio play failed:", error));
                        }
                        logout();
                    }}
                    title="Logout"
                >
                    <LogOutIcon className="size-5" />
                </button>
            </div>
        </div>
    );
}

export default Toolbar;
