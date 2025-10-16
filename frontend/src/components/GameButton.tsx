// src/components/Navbar.tsx

export default function GameButton({title, subtitle, color, icon}: {title: string, subtitle: string, color: string, icon: string}) {

    return (
        <>
        <a href={title === 'Games' ? '' : `/${title.toLowerCase()}`}>
            <article
            key={title}
            className={`rounded-2xl ${color} shadow-[0_8px_0_0] active:shadow-[0_4px_0_0_rgba(0,0,0,0.15)] translate-y-[-2px] active:translate-y-0 p-8 flex flex-col items-center justify-center h-full`}
            >
            <div className="flex flex-col items-center text-center">
                <img
                src={icon}
                alt="Puzzle Icon"
                className="size-24 mb-4"
                />
                <div className="text-3xl font-extrabold">{title}</div>
                <div className="text-base mt-2">{subtitle}</div>
            </div>
            </article>
        </a>
        </>
        
    );
}
