import Tippy from '@tippyjs/react';
import { Star } from 'lucide-react';

interface CurrentPointsBarProps {
  currentPoints: number;
}

export default function CurrentPointsBar({ currentPoints }: CurrentPointsBarProps) {
  return (
    <Tippy content="These are the points you currently have!" placement="bottom">
        <div data-testid="points-bar" className="hidden md:flex flex-col items-center bg-yellow-100 text-yellow-800 px-5 py-2 rounded-full font-bold shadow-inner cursor-default">
            <div className="flex items-center space-x-1 text-lg">
            <span>{currentPoints}</span>
            <Star size={20} className="fill-current text-yellow-500" />
            </div>

            {/* New text below */}
            <span className="text-xs font-normal text-yellow-700 leading-none">
            Current points
            </span>
        </div>
    </Tippy>
  );
}