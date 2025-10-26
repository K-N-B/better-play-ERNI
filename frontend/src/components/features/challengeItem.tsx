import React from 'react';
import { Link } from 'react-router-dom';
import type { Challenge } from '../../types'; // Adjust path if necessary
import { Swords, CheckCircle, Hourglass, X } from 'lucide-react';
// import { useAuth } from '../../hooks/authContext'; // Optional: Import if needed for perspective

export const ChallengeItem: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
    const isPending = challenge.status === 'PENDING';
    // const { user: currentUser } = useAuth(); // Example: Get current user to determine perspective
    // const isLoggedInUserRecipient = currentUser?.id === challenge.recipient.id;
    // const won = challenge.winner?.id === currentUser?.id;
    // const lost = challenge.winner && challenge.winner.id !== currentUser?.id;

    // Simplified win/loss logic (assuming viewer is the recipient)
    const won = challenge.winner?.id === challenge.recipient?.id;
    const lost = challenge.winner?.id === challenge.challenger?.id;

    // Determine opponent name based on perspective (simplified)
    const opponent = challenge.challenger; // Assuming logged-in user is always recipient in this list view

    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-start space-x-4 transition-shadow hover:shadow-md">
             {/* Icon based on status */}
             <div className="flex-shrink-0 pt-1">
                 {isPending ? <Hourglass className="text-yellow-500 animate-pulse" /> : // Added pulse for pending
                  won ? <CheckCircle className="text-green-500" /> :
                  lost ? <X className="text-red-500" /> :
                  <Swords className="text-gray-500"/>} {/* Icon for tie or unknown state */}
             </div>
             {/* Challenge Details */}
             <div className="flex-grow">
                <p className="text-sm">
                    {/* Message adjusted slightly */}
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
                         {won && <span className="ml-2 inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-semibold">You Won!</span>}
                         {lost && <span className="ml-2 inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-semibold">You Lost</span>}
                         {!isPending && !won && !lost && <span className="ml-2 inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-semibold">Tie / Other</span>}
                     </p>
                 )}
                 {/* Action Button for Pending */}
                 {isPending && (
                     <Link
                         to={`/game/${challenge.puzzle_type}?challenge_id=${challenge.id}`}
                         className="mt-2 inline-block px-3 py-1 bg-primary text-white text-xs font-medium rounded hover:bg-primary-dark shadow-sm transition-colors"
                     >
                         Play Now
                     </Link>
                 )}
             </div>
        </div>
    );
};

// If using default exports:
// export default ChallengeItem;