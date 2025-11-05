import React from 'react';
import { Link } from 'react-router-dom';
import type { Challenge } from '../../../types/challenge';
import { Swords, CheckCircle, Hourglass, X } from 'lucide-react';
import { clsx } from 'clsx';

interface ChallengeItemProps {
    challenge: Challenge;
    onPlayClick?: () => Promise<void>;
}

export const ChallengeItem: React.FC<ChallengeItemProps> = ({ challenge, onPlayClick }) => {
    const isPending = challenge.status === 'PENDING';
    const won = challenge.winner?.id === challenge.recipient?.id;
    const lost = challenge.winner?.id === challenge.challenger?.id;
    const opponent = challenge.challenger;

    const handlePlayClick = async (e: React.MouseEvent) => {
        // ✅ DEBUG: Log when Play Now is clicked
        console.log('[ChallengeItem] ========== PLAY NOW CLICKED ==========');
        console.log('[ChallengeItem] challenge.id:', challenge.id);
        console.log('[ChallengeItem] challenge.puzzle_type:', challenge.puzzle_type);
        console.log('[ChallengeItem] URL will be:', `/game/${challenge.puzzle_type}?challenge_id=${challenge.id}`);
        console.log('[ChallengeItem] ===========================================');
        
        if (onPlayClick) {
            e.preventDefault();
            await onPlayClick();
            window.location.href = `/game/${challenge.puzzle_type}?challenge_id=${challenge.id}`;
        }
    };

    return (
        <div className={clsx(
            "p-4 rounded-lg shadow flex items-center space-x-4 transition-shadow hover:shadow-md",
            isPending && "bg-yellow-50",
            won && "bg-green-50",
            lost && "bg-red-50",
            !isPending && !won && !lost && "bg-white"
        )}>
            {/* Icon based on status */}
            <div className="flex-shrink-0">
                {isPending ? <Hourglass className="text-yellow-500" /> :
                    won ? <CheckCircle className="text-green-500" /> :
                        lost ? <X className="text-red-500" /> :
                            <Swords className="text-gray-500" />}
            </div>

            {/* Challenge Details */}
            <div className="flex-grow">
                <p className="text-sm">
                    Challenge {isPending ? 'from' : 'vs'} <strong className="font-medium">{opponent.username}</strong> on{' '}
                    <strong className="font-medium">{challenge.puzzle_type}</strong>
                </p>
                <p className="text-xs text-black">
                    {opponent.username}'s Score: {challenge.challenger_submission.points_awarded} pts
                </p>
                {challenge.recipient_submission && (
                    <p className="text-xs text-black">
                        Your Score: {challenge.recipient_submission.points_awarded} pts
                        {won && <span className="ml-2 inline-block px-2 py-0.5 rounded bg-green-200 text-green-800 text-[10px] font-semibold">You Won!</span>}
                        {lost && <span className="ml-2 inline-block px-2 py-0.5 rounded bg-red-200 text-red-800 text-[10px] font-semibold">You Lost</span>}
                        {!isPending && !won && !lost && <span className="ml-2 inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-semibold">Tie</span>}
                    </p>
                )}
            </div>

            {/* Play Now Button */}
            {isPending && (
                <div className="flex-shrink-0 ml-auto">
                    <Link
                        to={`/game/${challenge.puzzle_type}?challenge_id=${challenge.id}`}
                        onClick={handlePlayClick}
                        className="inline-block px-3 py-1 bg-primary text-white text-xs font-medium rounded hover:bg-primary-dark shadow-sm transition-colors"
                    >
                        Play Now
                    </Link>
                </div>
            )}
        </div>
    );
};