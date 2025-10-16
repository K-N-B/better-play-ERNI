// src/components/Navbar.tsx
import {Link, useLocation} from "react-router-dom";
import logo from "../assets/logo.png"; // adjust if your logo path differs
import PrimaryButton from "./PrimaryButton";

export default function Navbar() {
    
    const location = useLocation();

    const navItems = [
        { name: "Home", path: "/", color: "bg-primary text-slate-50 shadow-[0_5px_0_0] shadow-primary-900", },
        { name: "Leaderboards", path: "/leaderboards", color: "bg-primary text-slate-50 shadow-[0_5px_0_0] shadow-primary-900", },
        { name: "┃" },
        { name: "Sudoku", path: "/sudoku", color: "bg-pink-400 text-slate-50 shadow-[0_5px_0_0] shadow-pink-800", },
        { name: "Wordle", path: "/wordle", color: "bg-emerald-500 text-slate-50 shadow-[0_5px_0_0] shadow-emerald-900", },
        { name: "ERNIgram", path: "/hangman", color: "bg-sky-400 text-slate-50 shadow-[0_5px_0_0] shadow-sky-800", },
        { name: "Crossword", path: "/crossword", color: "bg-yellow-400 text-slate-50 shadow-[0_5px_0_0] shadow-yellow-800", },
        { name: "Connections", path: "/connections", color: "bg-purple-500 text-slate-50 shadow-[0_5px_0_0] shadow-purple-900", },
    ];

    return (
        <header className=" top-0 left-0 w-full bg-slate-50 shadow-md z-50">
            <div
                className="mx-auto w-full max-w-[80rem] border transition-colors rounded-lg my-[10px] border-transparent bg-transparent"
                role="menu"
            >
                <div className="relative">
                    <div className="flex items-center h-[4rem] px-4">
                        <a className="absolute left-4 flex items-center h-full" href="/">
                            <img className="h-14 w-auto" src={logo} alt="Namespace Logo" />
                        </a>

                        <nav className="absolute left-0 right-0 flex justify-center items-center space-x-6">
                            {navItems.map((item, idx) => {
                                if (item.name === "┃") {
                                    return <span key={`separator-${idx}`} className="font-semibold text-primary">┃</span>;
                                }
                                // Only render Link if path is defined
                                if (item.path) {
                                    return (
                                        <PrimaryButton text={item.name} color={item.color} path={item.path} />
                                    );
                                }
                                return null;
                            })}
                        
                        </nav>
                        
                        <img aria-expanded="false" aria-haspopup="menu" id="profile-menu" src="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/ct-assets/team-4.jpg" alt="profile-picture" className="inline-block object-cover object-center size-12 rounded-full outline-none group border border-slate-800 p-0.5 lg:ml-auto"></img>
                    </div>
                </div>
            </div>
        </header>
    );
}
