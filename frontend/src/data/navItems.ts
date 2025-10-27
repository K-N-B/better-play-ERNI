import type { NavItem } from '../types/nav'; // Import the type

// Define styles for icons separately or within navItems
export const shopNavStyle = {
  name: 'Shop', // Not strictly needed here, but for consistency
  path: '/shop',
  activeClasses: 'bg-yellow-500 text-white shadow-[0_5px_0_0] shadow-yellow-800', // Example colors
  hoverClasses: 'hover:bg-yellow-500 hover:text-white', // Consistent hover
};

// You might define one for Notifications too if needed, e.g., using primary color
export const notificationNavStyle = {
    activeClasses: 'bg-primary text-white shadow-[0_5px_0_0] shadow-primary-900',
    hoverClasses: 'hover:bg-primary hover:text-white', // Consistent hover
}

export const navItems: NavItem[] = [
    {
        name: 'Home',
        path: '/',
        // Classes for the 3D active button
        activeClasses: 'bg-primary text-slate-50 shadow-[0_5px_0_0] shadow-primary-900',
        // Classes for the flat link's hover state
        hoverClasses: 'hover:text-primary-600',
    },
    {
        name: 'Leaderboards',
        path: '/leaderboards',
        activeClasses: 'bg-primary text-slate-50 shadow-[0_5px_0_0] shadow-primary-900',
        hoverClasses: 'hover:text-primary-600',
    },
    { name: '┃' },
    {
        name: 'Sudoku',
        path: '/game/sudoku',
        activeClasses: 'bg-pink-400 text-slate-50 shadow-[0_5px_0_0] shadow-pink-800',
        hoverClasses: 'hover:text-pink-500',
    },
    {
        name: 'Wordle',
        path: '/game/wordle',
        activeClasses: 'bg-emerald-500 text-slate-50 shadow-[0_5px_0_0] shadow-emerald-900',
        hoverClasses: 'hover:text-emerald-600',
    },
    {
        name: 'ERNIgram',
        path: '/game/ernigram',
        activeClasses: 'bg-sky-400 text-slate-50 shadow-[0_5px_0_0] shadow-sky-800',
        hoverClasses: 'hover:text-sky-500',
    },
    // (Add your other games here)
];