// src/components/ui/FloatingChangelogButton.tsx
import { useState } from 'react';

export const FloatingChangelogButton = () => {
    const [showChangelog, setShowChangelog] = useState(false);

    return (
        <>
            {/* Floating button */}
            <button
                className="fixed bottom-6 right-6 z-50 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-500 active:bg-primary-700 transition-all flex items-center justify-center"
                onClick={() => setShowChangelog(true)}
                title="View Changelogs"
            >
                📝
            </button>

            {/* Modal */}
            {showChangelog && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Changelogs</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Added new daily puzzles</li>
                            <li>Fixed mobile layout for progress tracker</li>
                            <li>Improved games strip responsiveness</li>
                        </ul>
                        <button
                            className="mt-6 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-500"
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
