// src/components/Navbar.tsx
// import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png"; // adjust if your logo path differs
import PrimaryButton from "./PrimaryButton";
import UserProfileModal from "./UserProfileModal";
import { useState } from "react";

export default function Navbar() {
//   const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const user = {
        name: "Jerome Barba",
        role: "October Bootcamp Trainee",
        currentStreak: 6,
        maxStreak: 14,
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
        color:
            "bg-emerald-500 text-slate-50 shadow-[0_5px_0_0] shadow-emerald-900",
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
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center text-white font-bold"
                        >
                            J
                        </button>

                        <UserProfileModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            user={user}
                            onLogout={() => alert("Logged out")}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
