import type { GameCardData } from '../types/game'; // Import the type
import { TextInitial, Brain, PenTool } from 'lucide-react'; // Import Lucide icons

export const gameCardData: GameCardData[] = [
  {
    title: 'Wordle',
    subtitle: 'Guess the 5-letter word.',
    bgColor: 'bg-emerald-500',
    shadowColor: 'shadow-emerald-900',
    IconComponent: TextInitial, // Assign the icon component
    path: '/game/wordle',
  },
  {
    title: 'Sudoku',
    subtitle: 'A logic puzzle for your break.',
    bgColor: 'bg-pink-400',
    shadowColor: 'shadow-pink-800',
    IconComponent: Brain, // Assign the icon component
    path: '/game/sudoku',
  },
  {
    title: 'ERNIgram',
    subtitle: 'Company-themed hangman.',
    bgColor: 'bg-sky-400',
    shadowColor: 'shadow-sky-800',
    IconComponent: PenTool, // Assign the icon component
    path: '/game/ernigram',
  },
  // Add other games here using appropriate Lucide icons
];
