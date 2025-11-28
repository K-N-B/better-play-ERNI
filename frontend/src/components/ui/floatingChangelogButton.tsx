// src/components/ui/FloatingChangelogButton.tsx
import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
// The ?raw suffix tells Vite to import the file content as a plain string
import readmeContent from "../../../../README.md?raw";

export const FloatingChangelogButton = () => {
  const [showChangelog, setShowChangelog] = useState(false);

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
        className="hidden md:block fixed bottom-6 right-6 z-50 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-500 active:bg-primary-700 transition-all flex items-center justify-center hover:scale-110"
        onClick={() => setShowChangelog(true)}
        title="View Changelogs"
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
