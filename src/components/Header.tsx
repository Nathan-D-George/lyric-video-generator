"use client";

import type { User } from "firebase/auth";
import { useAppStore } from "./app-store";

export default function Header({
  user,
  clickHandler,
} : {
  user: User;
  clickHandler: () => void;
}) {
  const {
    setAuthMode,
  } = useAppStore();

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900/60 backdrop-blur px-6 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => !user ? setAuthMode('home') : setAuthMode('dashboard')}>
        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500/50"></div>
        <span className="text-sm font-bold tracking-widest text-gray-200 uppercase">Kinetic Lyric Studio</span>
      </div>

      {user && (
        <div className="flex items-center space-x-4">
          <span className="text-xs font-medium text-gray-400 border border-gray-800 bg-gray-900 px-3 py-1 rounded-md">{user.email}</span>
          <button onClick={clickHandler} className="text-xs font-semibold text-gray-400 hover:text-white transition uppercase">Sign Out</button>
        </div>
      )}
    </header>
  );
};
