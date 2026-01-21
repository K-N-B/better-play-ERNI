// src/components/ui/FloatingAboutButton.tsx
import { useState, useRef, useEffect, useCallback } from "react";

// DIFFERENTIATOR: Y offset is 100 so it spawns ABOVE the changelog button
const INITIAL_OFFSET_X = 24;
const INITIAL_OFFSET_Y = 100;
const DRAG_THRESHOLD = 5;

export const FloatingAboutUsButton = () => {
  const [showAbout, setShowAbout] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // --- CAROUSEL STATE (New) ---
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // --- SWIPE LOGIC (New) ---
  const minSwipeDistance = 50;

  const onModalTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onModalTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onModalTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Next Card
      setActiveIndex((prev) => (prev === devs.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe) {
      // Prev Card
      setActiveIndex((prev) => (prev === 0 ? devs.length - 1 : prev - 1));
    }
  };

  // --- BUTTON DRAG LOGIC (Existing) ---
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    wasDragged: false,
  });

  // Initialization
  useEffect(() => {
    const setInitialPosition = () => {
      if (buttonRef.current) {
        setPosition({
          x: window.innerWidth - buttonRef.current.offsetWidth - INITIAL_OFFSET_X,
          y: window.innerHeight - buttonRef.current.offsetHeight - INITIAL_OFFSET_Y,
        });
      }
    };
    setInitialPosition();
    window.addEventListener("resize", setInitialPosition);
    return () => window.removeEventListener("resize", setInitialPosition);
  }, []);

  // --- TOUCH HANDLERS (For the Floating Button) ---
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    if (showAbout || !buttonRef.current) return;
    const touch = e.touches[0];
    const rect = buttonRef.current.getBoundingClientRect();
    dragRef.current = {
      isDragging: true,
      startX: touch.clientX - rect.left,
      startY: touch.clientY - rect.top,
      wasDragged: false,
    };
    e.currentTarget.style.transition = "none";
  }, [showAbout]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    if (!dragRef.current.isDragging || !buttonRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    let newX = touch.clientX - dragRef.current.startX;
    let newY = touch.clientY - dragRef.current.startY;
    newX = Math.min(Math.max(newX, 0), window.innerWidth - buttonRef.current.offsetWidth);
    newY = Math.min(Math.max(newY, 0), window.innerHeight - buttonRef.current.offsetHeight);
    if (Math.abs(newX - position.x) > DRAG_THRESHOLD || Math.abs(newY - position.y) > DRAG_THRESHOLD) {
      dragRef.current.wasDragged = true;
    }
    setPosition({ x: newX, y: newY });
  }, [position]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    if (dragRef.current.isDragging) e.currentTarget.style.transition = "";
    if (!dragRef.current.wasDragged) setShowAbout(true);
    dragRef.current.isDragging = false;
  }, []);

  // --- MOUSE HANDLERS (For the Floating Button) ---
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current.isDragging || !buttonRef.current) return;
    e.preventDefault();
    let newX = e.clientX - dragRef.current.startX;
    let newY = e.clientY - dragRef.current.startY;
    newX = Math.min(Math.max(newX, 0), window.innerWidth - buttonRef.current.offsetWidth);
    newY = Math.min(Math.max(newY, 0), window.innerHeight - buttonRef.current.offsetHeight);
    if (Math.abs(newX - position.x) > DRAG_THRESHOLD || Math.abs(newY - position.y) > DRAG_THRESHOLD) {
      dragRef.current.wasDragged = true;
    }
    setPosition({ x: newX, y: newY });
  }, [position]);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current.isDragging && buttonRef.current) buttonRef.current.style.transition = "";
    if (dragRef.current.isDragging && !dragRef.current.wasDragged) setShowAbout(true);
    dragRef.current.isDragging = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (showAbout || !buttonRef.current) return;
    if (e.button !== 0) return;
    const rect = buttonRef.current.getBoundingClientRect();
    dragRef.current = {
      isDragging: true,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      wasDragged: false,
    };
    e.currentTarget.style.transition = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [showAbout, handleMouseMove, handleMouseUp]);

  // --- DATA ---
  const devs = [
    {
      name: "Yna Foronda",
      role: "Lead & UI/UX",
      desc: "A comsci fresh graduate that loves the crafts, the puzzles, and the arts. She was the lead of the team behind 'Better Play ERNI'.",
      funFact: "If you like going to art markets, playing games, and listening to AURORA, then she's your go-to!",
      color: "bg-[#6BC5D2]",
      shadow: "shadow-[#4da0ad]",
      rotation: "md:-rotate-6",
      zIndex: "z-10",
      avatarPos: "-top-8 -right-4",
      imgUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yna&hair=long&clothing=graphicShirt",
    },
    {
      name: "Dayniel Caadiang",
      role: "Frontend Dev",
      desc: "A comsci fresh graduate that loves the crafts, the puzzles, and the arts. Mainly on the UI/UX and front-end development.",
      funFact: "If you like going to art markets, playing games, and listening to AURORA, then she's your go-to!",
      color: "bg-[#CFA6D6]",
      shadow: "shadow-[#a57bb0]",
      rotation: "md:rotate-3",
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
      color: "bg-[#F4D35E]",
      shadow: "shadow-[#d6b745]",
      rotation: "md:rotate-12",
      zIndex: "z-20",
      avatarPos: "-top-8 -right-4",
      imgUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yughie&glasses=round",
    },
  ];

  return (
    <>
      {/* Floating button */}
      <button
        ref={buttonRef}
        className="md:block fixed z-50 bg-[#00A651] text-white p-2 md:p-3 rounded-full shadow-lg hover:bg-[#008c44] active:scale-95 transition-all flex items-center justify-center border-2 border-white"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          touchAction: "none",
          willChange: "transform",
          top: 0,
          left: 0,
        }}
        title="About the Devs"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span className="text-2xl">👥</span>
      </button>

      {/* Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden">
          {/* Main Container */}
          <div className="relative w-full max-w-5xl flex flex-col items-center">
            
            {/* Header Badge & Close Button */}
            <div className="relative z-50 mb-8 md:mb-12">
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
            <div 
                className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-4 w-full px-4"
                // NEW: Attach Swipe Events
                onTouchStart={onModalTouchStart}
                onTouchMove={onModalTouchMove}
                onTouchEnd={onModalTouchEnd}
            >
              {devs.map((dev, index) => {
                 // Logic to determine if this card is valid for mobile view
                 const isMobileActive = index === activeIndex;

                 return (
                  <div
                    key={index}
                    className={`
                      relative w-full max-w-[300px] md:w-80 p-6 rounded-4xl 
                      text-[#1a1a1a] shrink-0 transition-transform hover:z-50 hover:scale-105 duration-300
                      shadow-[0_5px_0_0]
                      ${dev.color} ${dev.shadow}

                      /* DESKTOP: Default scattered look (hidden on mobile by default) */
                      hidden md:block 
                      ${dev.rotation} ${dev.zIndex} ${dev.translate || ''}

                      /* MOBILE: Show only active card, reset rotation/translate */
                      ${isMobileActive ? "!block !z-50" : ""}
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
                 )
              })}
            </div>

            {/* Mobile Navigation Dots (Visible only on small screens) */}
            <div className="flex md:hidden gap-2 mt-8">
                {devs.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        className={`w-3 h-3 rounded-full transition-all ${
                            idx === activeIndex ? "bg-white scale-110" : "bg-white/40"
                        }`}
                    />
                ))}
            </div>

          </div>
        </div>
      )}
    </>
  );
};