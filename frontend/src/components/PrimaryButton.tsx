import { Link } from "react-router-dom";


export default function PrimaryButton({text, color, path}: {text: string, color: string, path: string}) {

    return (
        <>
        <Link
            key={path}
            to={path}
            className={`font-semibold text-primary px-4 py-2 rounded-md 
                ${location.pathname === path ? color : ''}`}
        >
            {text}
        </Link>
        </>
        
    );
}
