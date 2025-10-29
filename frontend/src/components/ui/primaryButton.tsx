import { Link } from 'react-router-dom';

interface PrimaryButtonProps {
  text: string;
  color: string;
  path: string;
}

export default function PrimaryButton({ text, color, path }: PrimaryButtonProps) {
  return (
    <Link
      to={path}
      className={`relative inline-flex items-center justify-center h-10 px-5 
                  rounded-lg font-semibold text-base tracking-wide 
                  active:translate-y-[2px] active:shadow-[0_3px_0_0]
                  transition-all duration-150 ${color}`}
    >
      {text}
    </Link>
  );
}