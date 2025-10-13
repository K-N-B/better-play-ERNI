import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png"; // adjust if your logo path differs

type NavItem =
  | { type: "link"; name: string; path: string; color: string }
  | { type: "separator"; label: string };

export default function Navbar() {
  const location = useLocation();

  const navItems: NavItem[] = [
    { type: "link", name: "Home", path: "/", color: "bg-primary text-slate-50 shadow-[0_5px_0_0] shadow-primary-900" },
    { type: "link", name: "Leaderboards", path: "/leaderboards", color: "bg-primary text-slate-50 shadow-[0_5px_0_0] shadow-primary-900" },
    { type: "separator", label: "•" },
    { type: "link", name: "Sudoku", path: "/sudoku", color: "bg-sky-400 text-slate-50 shadow-[0_5px_0_0] shadow-sky-800" },
    { type: "link", name: "Wordle", path: "/wordle", color: "bg-emerald-500 text-slate-50 shadow-[0_5px_0_0] shadow-emerald-900" },
    { type: "link", name: "Hangman", path: "/hangman", color: "bg-pink-400 text-slate-50 shadow-[0_5px_0_0] shadow-pink-800" },
    { type: "link", name: "Crossword", path: "/crossword", color: "bg-yellow-400 text-slate-50 shadow-[0_5px_0_0] shadow-yellow-800" },
    { type: "link", name: "Connections", path: "/connections", color: "bg-purple-500 text-slate-50 shadow-[0_5px_0_0] shadow-purple-900" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full bg-slate-50 shadow-md z-50">
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
              {navItems.map((item, idx) =>
                item.type === "separator" ? (
                  <span key={`separator-${idx}`} className="font-semibold text-primary">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`font-semibold text-primary px-4 py-2 rounded-md ${
                      location.pathname === item.path ? item.color : ""
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              )}
            </nav>

            <img
              aria-expanded="false"
              aria-haspopup="menu"
              id="profile-menu"
              src="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/ct-assets/team-4.jpg"
              alt="profile-picture"
              className="inline-block object-cover object-center size-12 rounded-full outline-none group border border-slate-800 p-0.5 lg:ml-auto"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
