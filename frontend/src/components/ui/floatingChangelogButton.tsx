// src/components/ui/FloatingChangelogButton.tsx
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
// The ?raw suffix tells Vite to import the file content as a plain string
import readmeContent from "../../../../README.md?raw";

const INITIAL_OFFSET = 24;

export const FloatingChangelogButton = () => {
  const [showChangelog, setShowChangelog] = useState(false);

  // 1. STATE: Stores the current top/left position for the inline style
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  // --- Initialization (Sets the initial bottom-right position once on mount) ---
  useEffect(() => {
    const setInitialPosition = () => {
      if (buttonRef.current) {
        // Calculate initial position equivalent to fixed bottom-6 right-6
        const buttonWidth = buttonRef.current.offsetWidth;
        const buttonHeight = buttonRef.current.offsetHeight;

        setPosition({
          x: window.innerWidth - buttonWidth - INITIAL_OFFSET,
          y: window.innerHeight - buttonHeight - INITIAL_OFFSET,
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
      if (showChangelog || !buttonRef.current) return;

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
    [showChangelog]
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
  // This function extracts ONLY the content under "## Changelog"
  // It stops when it hits the next "## " header or the end of the file.
  const changelogText = useMemo(() => {
    const sectionHeader = "## Changelog";
    const startIndex = readmeContent.indexOf(sectionHeader);

    if (startIndex === -1) return "No changelog found in README.md.";

    // Start reading after the header
    const contentStart = startIndex + sectionHeader.length;
    const remainingText = readmeContent.slice(contentStart);

    // Find the start of the NEXT section (assuming your headers use ##)
    const nextSectionIndex = remainingText.indexOf("\n---");

    if (nextSectionIndex === -1) {
      return remainingText.trim();
    }

    return remainingText.slice(0, nextSectionIndex).trim();
  }, []);

  return (
    <>
      {/* Floating button */}
      <button
        ref={buttonRef} // Attach ref here
        // IMPORTANT: Change 'fixed bottom-6 right-6' to 'absolute'
        className="md:block fixed z-50 bg-primary-600 text-white p-2 md:p-4 rounded-full shadow-lg hover:bg-primary-500 active:bg-primary-700 transition-all flex items-center justify-center hover:scale-110"
        style={{
          // Use 'transform: translate'
          transform: `translate(${position.x}px, ${position.y}px)`,
          touchAction: "none",
          willChange: "transform",
          // Ensure fixed positioning is offset to 0,0 before transform applies
          top: 0,
          left: 0,
        }}
        onClick={(e) => {
          // Check if the button was dragged; if so, prevent the click
          if (dragRef.current.wasDragged) {
            // Reset drag flag immediately
            dragRef.current.wasDragged = false;
            return;
          }
          setShowChangelog(true);
        }}
        title="View Changelogs"
        // Apply Dynamic Position via Inline Style

        // Attach Touch Event Handlers
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span className="text-xl">📝</span>
      </button>

      {/* Modal */}
      {showChangelog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">
                Latest Updates
              </h2>
              <button
                onClick={() => setShowChangelog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto pr-2 custom-scrollbar">
              <div className="prose prose-sm prose-blue max-w-none text-gray-600">
                <ReactMarkdown
                  components={{
                    // Custom styling for markdown elements to match your UI
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-2 mb-4">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm leading-relaxed">{children}</li>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-md font-bold text-primary-600 mt-4 mb-2">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => <p className="mb-2">{children}</p>,
                  }}
                >
                  {changelogText}
                </ReactMarkdown>
              </div>
            </div>

            <button
              className="mt-6 w-full bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-500 font-medium transition-colors shadow-md shadow-primary-600/20"
              onClick={() => setShowChangelog(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
