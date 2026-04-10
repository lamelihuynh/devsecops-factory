import { Navigate, Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LogInPage";
import SignUpPage from "./pages/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader";

import { Toaster } from "react-hot-toast";

function App() {
  const { checkAuth, isCheckingAuth, authUser, subscribeToAuthChanges } =
    useAuthStore();

  useEffect(() => {
    checkAuth();
    const cleanup = subscribeToAuthChanges();

    // Cleanup storage event listener on unmount
    return cleanup;
    // Empty dependency array - checkAuth and subscribeToAuthChanges are stable Zustand functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="min-h-screen bg-zinc-950 relative flex items-center justify-center p-4 overflow-hidden">
      {/* DECORATORS - GRID BG & GLOW SHAPES */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute top-0 -left-4 size-96 bg-pink-500 opacity-20 blur-[100px]" />
      <div className="absolute bottom-0 -right-4 size-96 bg-amber-500 opacity-20 blur-[100px]" />

      <Routes>
        <Route
          path="/"
          element={authUser ? <ChatPage /> : <Navigate to={"/login"} replace />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to={"/"} replace />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to={"/"} replace />}
        />
      </Routes>

      <Toaster />
    </div>
  );
}
export default App;
