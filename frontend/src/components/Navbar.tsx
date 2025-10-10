// src/components/Navbar.tsx

import logo from "../assets/logo.png"; // adjust if your logo path differs

export default function Navbar() {

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
                            <a href="/#" className="bg-primary font-medium text-md text-slate-50 px-4 py-2 rounded-md shadow-[0_5px_0_0_#033778] active:shadow-[0_4px_0_0_rgba(0,0,0,0.15)] translate-y-[-2px] active:translate-y-0" type="button">
                                Home
                            </a>
                            <a className="font-semibold text-primary" href="/leaderboards">Leaderboards</a>
                            <a className="font-semibold text-primary">┃</a>
                            <a className="font-semibold text-primary" href="/sudoku">Sudoku</a>
                            <a className="font-semibold text-primary" href="/wordle">Wordle</a>
                            <a className="font-semibold text-primary" href="/hangman">Hangman</a>
                            <a className="font-semibold text-primary" href="/crossword">Crossword</a>
                            <a className="font-semibold text-primary" href="/connections">Connections</a>
                        </nav>
                        
                        <img aria-expanded="false" aria-haspopup="menu" id="profile-menu" src="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/ct-assets/team-4.jpg" alt="profile-picture" className="inline-block object-cover object-center size-12 rounded-full outline-none group border border-slate-800 p-0.5 lg:ml-auto"></img>
                    </div>
                </div>
            </div>
        </header>
    );
}
