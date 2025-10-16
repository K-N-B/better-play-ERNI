// src/components/Navbar.tsx
import { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import PrimaryButton from "./PrimaryButton";
import UserProfileModal from "./UserProfileModal";

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  total_points: number;
  avatar_url?: string;
}

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:8000/auth/user/', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    {
      name: "Home",
      path: "/",
      color: "bg-primary text-slate-50 shadow-[0_5px_0_0] shadow-primary-900",
    },
    {
      name: "Leaderboards",
      path: "/leaderboards",
      color: "bg-primary text-slate-50 shadow-[0_5px_0_0] shadow-primary-900",
    },
    { name: "┃" },
    {
      name: "Sudoku",
      path: "/sudoku",
      color: "bg-pink-400 text-slate-50 shadow-[0_5px_0_0] shadow-pink-800",
    },
    {
      name: "Wordle",
      path: "/wordle",
      color: "bg-emerald-500 text-slate-50 shadow-[0_5px_0_0] shadow-emerald-900",
    },
    {
      name: "ERNIgram",
      path: "/ernigram",
      color: "bg-sky-400 text-slate-50 shadow-[0_5px_0_0] shadow-sky-800",
    },
    {
      name: "Crossword",
      path: "/crossword",
      color: "bg-yellow-400 text-slate-50 shadow-[0_5px_0_0] shadow-yellow-800",
    },
    {
      name: "Connections",
      path: "/connections",
      color: "bg-purple-500 text-slate-50 shadow-[0_5px_0_0] shadow-purple-900",
    },
  ];

  // Get user initial for avatar
  const getUserInitial = () => {
    if (!user) return "?";
    const name = user.display_name || user.username;
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="top-0 left-0 w-full bg-slate-50 shadow-md z-50">
      <div className="mx-auto w-full max-w-[80rem] border border-transparent bg-transparent rounded-lg my-[10px] transition-colors">
        <div className="flex items-center justify-between h-[4rem] px-6">
          
          {/* Left: Logo */}
          <a href="/" className="flex items-center space-x-2">
            <img className="h-14 w-auto" src={logo} alt="Namespace Logo" />
          </a>

          {/* Center: Navigation */}
          <nav className="flex justify-center items-center space-x-6">
            {navItems.map((item, idx) => {
              if (item.name === "┃") {
                return (
                  <span
                    key={`separator-${idx}`}
                    className="font-semibold text-primary"
                  >
                    ┃
                  </span>
                );
              }
              if (item.path) {
                return (
                  <PrimaryButton
                    key={item.path}
                    text={item.name}
                    color={item.color}
                    path={item.path}
                  />
                );
              }
              return null;
            })}
          </nav>

          {/* Right: Profile button */}
          <div className="flex items-center">
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center text-white font-bold hover:bg-sky-500 transition"
                title={user?.display_name || user?.username || "Profile"}
              >
                {getUserInitial()}
              </button>
            )}

            <UserProfileModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      </div>
    </header>
  );
}