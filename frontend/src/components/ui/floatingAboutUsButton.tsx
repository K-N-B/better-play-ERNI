// src/components/ui/FloatingAboutButton.tsx
import { useState, useRef, useEffect, useCallback } from "react";

// DIFFERENTIATOR: Y offset is 100 so it spawns ABOVE the changelog button
const INITIAL_OFFSET_X = 24;
const INITIAL_OFFSET_Y = 100;

export const FloatingAboutUsButton = () => {
    const [showAbout, setShowAbout] = useState(false);

    // 1. STATE: Stores the current top/left position for the inline style
    const [position, setPosition] = useState({
        x: 0,
        y: 0,
    });

    // --- Initialization (Sets the initial bottom-right position once on mount) ---
    useEffect(() => {
        const setInitialPosition = () => {
            if (buttonRef.current) {
                // Calculate initial position
                const buttonWidth = buttonRef.current.offsetWidth;
                const buttonHeight = buttonRef.current.offsetHeight;

                setPosition({
                    x: window.innerWidth - buttonWidth - INITIAL_OFFSET_X,
                    y: window.innerHeight - buttonHeight - INITIAL_OFFSET_Y,
                });
            }
        };

        // Set initial position
        setInitialPosition();

        // Recalculate position on window resize
        window.addEventListener("resize", setInitialPosition);
        return () => window.removeEventListener("resize", setInitialPosition);
    }, []);

    const handleTouchStart = useCallback(
        (e: React.TouchEvent<HTMLButtonElement>) => {
            // Prevent drag if modal is open
            if (showAbout || !buttonRef.current) return;

            const touch = e.touches[0];
            const rect = buttonRef.current.getBoundingClientRect();

            // Store where the user touched relative to the button's top-left corner
            dragRef.current = {
                isDragging: true,
                startX: touch.clientX - rect.left,
                startY: touch.clientY - rect.top,
                wasDragged: false,
            };

            // Remove transition during drag for smooth movement
            e.currentTarget.style.transition = "none";
        },
        [showAbout]
    );

    const handleTouchMove = useCallback(
        (e: React.TouchEvent<HTMLButtonElement>) => {
            if (!dragRef.current.isDragging || !buttonRef.current) return;

            // Prevent default touch behavior (e.g., scrolling)
            e.preventDefault();

            const touch = e.touches[0];

            // Calculate new position by subtracting the touch-to-button offset (startX/startY)
            let newX = touch.clientX - dragRef.current.startX;
            let newY = touch.clientY - dragRef.current.startY;

            // Boundary constraints to keep the button within the viewport
            const buttonWidth = buttonRef.current.offsetWidth;
            const buttonHeight = buttonRef.current.offsetHeight;

            newX = Math.min(newX, window.innerWidth - buttonWidth); // Right boundary
            newX = Math.max(newX, 0); // Left boundary
            // FIX: Ensure newY never exceeds the viewport height minus button height
            newY = Math.min(newY, window.innerHeight - buttonHeight); // Bottom boundary
            newY = Math.max(newY, 0); // Top boundary

            // If movement is detected, set the wasDragged flag
            if (Math.abs(newX - position.x) > 2 || Math.abs(newY - position.y) > 2) {
                dragRef.current.wasDragged = true;
            }

            setPosition({ x: newX, y: newY });
        },
        [position]
    );

    const handleTouchEnd = useCallback(
        (e: React.TouchEvent<HTMLButtonElement>) => {
            if (dragRef.current.isDragging) {
                // Re-enable CSS transition after drag ends
                e.currentTarget.style.transition = "";
            }
            dragRef.current.isDragging = false;
        },
        []
    );

    // 2. REFS: Used to reference the button and track drag state
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dragRef = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        wasDragged: false, // Prevents click event after drag
    });

    // handleMouseMove needs to be defined globally or be accessible to the window listener
    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            // Note: This is a native MouseEvent, not React.MouseEvent
            if (!dragRef.current.isDragging || !buttonRef.current) return;

            // Prevent default text selection/scrolling
            e.preventDefault();

            // Calculate new position
            let newX = e.clientX - dragRef.current.startX;
            let newY = e.clientY - dragRef.current.startY;

            // Boundary constraints (same logic as in handleTouchMove)
            const buttonWidth = buttonRef.current.offsetWidth;
            const buttonHeight = buttonRef.current.offsetHeight;

            newX = Math.min(newX, window.innerWidth - buttonWidth);
            newX = Math.max(newX, 0);
            newY = Math.min(newY, window.innerHeight - buttonHeight);
            newY = Math.max(newY, 0);

            // Set wasDragged flag
            if (Math.abs(newX - position.x) > 2 || Math.abs(newY - position.y) > 2) {
                dragRef.current.wasDragged = true;
            }

            setPosition({ x: newX, y: newY });
        },
        [position]
    );

    // handleMouseUp also needs to be defined globally or be accessible to the window listener
    const handleMouseUp = useCallback(
        () => {
            if (dragRef.current.isDragging) {
                // Find the button element to reset the transition style
                // We can't use e.currentTarget here since the listener is on the window.
                if (buttonRef.current) {
                    buttonRef.current.style.transition = "";
                }
            }
            dragRef.current.isDragging = false;

            // IMPORTANT: Remove the global listeners
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        },
        [handleMouseMove]
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            // Prevent drag if modal is open
            if (showAbout || !buttonRef.current) return;

            // Use clientX/clientY from the MouseEvent
            const rect = buttonRef.current.getBoundingClientRect();

            dragRef.current = {
                isDragging: true,
                startX: e.clientX - rect.left,
                startY: e.clientY - rect.top,
                wasDragged: false,
            };

            // Remove transition during drag for smooth movement
            e.currentTarget.style.transition = "none";

            // IMPORTANT: Attach global listeners for move/up events
            // This ensures dragging continues even if the mouse leaves the button
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        },
        [showAbout, handleMouseMove, handleMouseUp] // Include the move/up handlers
    );

    // --- DATA: Devs Config ---
    const devs = [
        {
            name: "Yna Foronda",
            role: "Lead & UI/UX",
            desc: "A comsci fresh graduate that loves the crafts, the puzzles, and the arts. She was the lead of the team behind 'Better Play ERNI'.",
            funFact: "If you like going to art markets, playing games, and listening to AURORA, then she's your go-to!",
            color: "bg-blue-200",
            shadow: "shadow-blue-500",
            rotation: "-rotate-3 md:-rotate-6",
            zIndex: "z-10",
            avatarPos: "-top-8 -right-4",
            imgUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yna&hair=long&clothing=graphicShirt",
        },
        {
            name: "Dayniel Caadiang",
            role: "Frontend Dev",
            desc: "A comsci fresh graduate that loves the crafts, the puzzles, and the arts. Mainly on the UI/UX and front-end development.",
            funFact: "If you like going to art markets, playing games, and listening to AURORA, then she's your go-to!",
            color: "bg-pink-200",
            shadow: "shadow-pink-500",
            rotation: "rotate-2 md:rotate-3",
            zIndex: "z-0",
            translate: "md:translate-y-12",
            avatarPos: "-bottom-8 -right-4",
            imgUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dayniel&hair=long",
        },
        {
            name: "Yughie Perez",
            role: "Frontend Dev",
            desc: "A comsci fresh graduate that loves the crafts, the puzzles, and the arts. Mainly on the UI/UX and front-end development.",
            funFact: "If you like going to art markets, playing games, and listening to AURORA, then she's your go-to!",
            color: "bg-amber-200",
            shadow: "shadow-amber-500",
            rotation: "rotate-3 md:rotate-12",
            zIndex: "z-20",
            avatarPos: "-top-8 -right-4",
            imgUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yughie&glasses=round",
        },
    ];

    return (
        <>
            {/* Floating button */}
            <button
                ref={buttonRef} // Attach ref here
                // IMPORTANT: Change 'fixed bottom-6 right-6' to 'absolute'
                className="md:block fixed z-50 bg-white text-primary p-2 md:p-4 rounded-full shadow-lg hover:bg-primary-200 active:bg-primary-400 transition-all flex items-center justify-center"
                style={{
                    // Use 'transform: translate'
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    touchAction: "none",
                    willChange: "transform",
                    // Ensure fixed positioning is offset to 0,0 before transform applies
                    top: 0,
                    left: 0,
                }}
                title="About the Devs"
                // Apply Dynamic Position via Inline Style

                // Attach Touch Event Handlers
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => setShowAbout(true)}
            >
                <span className="text-xl">👥</span>
            </button>

            {/* Modal */}
            {showAbout && (
                <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden">
                    {/* Main Container */}
                    <div className="relative w-full max-w-5xl flex flex-col items-center">

                        {/* Header Badge */}
                        <div className="relative z-50 mb-8 md:mb-8">
                            <div className="bg-emerald-600 text-white font-bold text-lg md:text-xl px-8 py-2 rounded-full shadow-[0_5px_0_0] shadow-emerald-800 transform -rotate-2">
                                About the devs
                            </div>
                            <button
                                onClick={() => setShowAbout(false)}
                                className="absolute -top-14 left-1/2 -translate-x-1/2 bg-transparent text-red-300 hover:text-red-600 font-bold text-4xl transition-colors"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Cards Container */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-4 w-full px-4">
                            {devs.map((dev, index) => (
                                <div
                                    key={index}
                                    className={`
                                        relative w-full max-w-[300px] md:w-80 p-6 rounded-4xl 
                                        text-[#1a1a1a] shrink-0 transition-transform hover:z-50 hover:scale-105 duration-300
                                        shadow-[0_5px_0_0]
                                        ${dev.color} ${dev.shadow}
                                        ${dev.rotation} 
                                        ${dev.zIndex}
                                        ${dev.translate || ''}
                                    `}
                                >
                                    <div className={`absolute w-20 h-20 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md ${dev.avatarPos}`}>
                                        <img src={dev.imgUrl} alt={dev.name} className="w-full h-full object-cover" />
                                    </div>

                                    <div className="mt-2">
                                        <h3 className="text-2xl font-bold mb-1 leading-tight">{dev.name}</h3>
                                        <div className="h-0.5 w-full bg-black/10 my-3 rounded-full"></div>
                                        <div className="space-y-4 text-sm font-medium leading-relaxed">
                                            <p>{dev.desc}</p>
                                            <p className="opacity-90">{dev.funFact}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};