import React from 'react';
import { Link } from 'react-router-dom';
import type { Challenge } from '../../../types'; // Adjust path if necessary
import { Swords, CheckCircle, Hourglass, X } from 'lucide-react';
import { clsx } from 'clsx';
// import { useAuth } from '../../hooks/authContext'; // Optional: Import if needed for perspective

export const ChallengeItem: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
    const isPending = challenge.status === 'PENDING';

    // Simplified win/loss logic (assuming viewer is the recipient)
    const won = challenge.winner?.id === challenge.recipient?.id;
    const lost = challenge.winner?.id === challenge.challenger?.id;

    // Determine opponent name based on perspective (simplified)
    const opponent = challenge.challenger;

    return (
        // --- 2. Apply conditional classes to the main div ---
        <div className={clsx(
            "p-4 rounded-lg shadow flex items-center space-x-4 transition-shadow hover:shadow-md", 
            isPending && "bg-blue-100 ",
            won && "bg-green-100 ",
            lost && "bg-red-100 ",
            !isPending && !won && !lost && "bg-white "
        )}>
             {/* Icon based on status */}
             <div className="flex-shrink-0"> {/* Removed pt-1, items-center handles alignment */}
                 {isPending ? <Hourglass className="text-yellow-500 animate-pulse" /> :
                    won ? <CheckCircle className="text-green-500" /> :
                        lost ? <X className="text-red-500" /> :
                            <Swords className="text-gray-500" />}
             </div>
             
             {/* Challenge Details */}
             {/* This div will expand to fill available space */}
             <div className="flex-grow"> 
                <p className="text-sm">
                    Challenge {isPending ? 'from' : 'vs'} <strong className="font-medium">{opponent.username}</strong> on{' '}
                    <strong className="font-medium">{challenge.puzzle_type}</strong>
                </p>
                 <p className="text-xs text-gray-500 mt-1">
                    {opponent.username}'s Score: {challenge.challenger_submission.points_awarded} pts
                </p>
                {challenge.recipient_submission && (
                    <p className="text-xs text-gray-500">
                        Your Score: {challenge.recipient_submission.points_awarded} pts
                        {/* Result Badges */}
                        {won && <span className="ml-2 inline-block px-2 py-0.5 rounded bg-green-200 text-green-800 text-[10px] font-semibold">You Won!</span>}
                        {lost && <span className="ml-2 inline-block px-2 py-0.5 rounded bg-red-200 text-red-800 text-[10px] font-semibold">You Lost</span>}
                        {!isPending && !won && !lost && <span className="ml-2 inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-semibold">Tie / Other</span>}
                    </p>
                )}
                {/* --- Play Now button REMOVED from this div --- */}
             </div>

             {/* --- Play Now Button (now a direct child of the flex container) --- */}
             {isPending && (
                <div className="flex-shrink-0 ml-auto"> {/* ml-auto pushes it to the right, flex-shrink-0 prevents shrinking */}
                    <Link
                        to={`/game/${challenge.puzzle_type}?challenge_id=${challenge.id}`}
                        className="inline-block px-3 py-1 bg-primary text-white text-xs font-medium rounded hover:bg-primary-dark shadow-sm transition-colors"
                    >
                        Play Now
                    </Link>
                </div>
             )}
             {/* --- --- */}
        </div>
    );
};

// If using default exports:
// export default ChallengeItem;