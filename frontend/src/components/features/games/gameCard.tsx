import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react'; // Import the type

interface GameCardProps {
  title: string;
  subtitle: string;
  bgColor: string;
  shadowColor: string;
  IconComponent: LucideIcon; // Change 'icon' prop to 'IconComponent'
  path: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  title,
  subtitle,
  bgColor,
  shadowColor,
  IconComponent, // Destructure the component
  path,
}) => {
  return (
    <Link
      to={path}
      className={
        `block rounded-2xl p-8 h-full transition-transform duration-100 ease-in-out
         ${bgColor} ${shadowColor} shadow-[0_8px_0_0]
         hover:translate-y-[-4px] hover:shadow-[0_12px_0_0]
         active:translate-y-[0px] active:shadow-[0_4px_0_0]`
      }
      style={{ willChange: 'transform, box-shadow' }}
    >
      <article className="flex flex-col items-center justify-center text-center text-white">
        <div className='flex flex-row items-center justify-center gap-2 mb-2'>
          <IconComponent className="size-10" strokeWidth={1.5} /> {/* Adjust size/stroke */}
          <div className="text-2xl sm:text-3xl font-semibold">{title}</div>
        </div>
        
        <div className="text-sm sm:text-base mt-2">{subtitle}</div>
      </article>
    </Link>
  );
};