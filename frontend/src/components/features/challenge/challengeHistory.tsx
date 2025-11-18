import { ChallengeItem } from './challengeItem';
import { Trophy } from 'lucide-react';
import type { Challenge } from '../../../types/challenge';

interface HistoryChallengesProps {
    completed: Challenge[];
}

export const HistoryChallenges = ({ completed }: HistoryChallengesProps) => (
    <div className="space-y-3">
        {completed.length > 0 ? (
            completed.map((c: Challenge) => (
                <ChallengeItem key={`completed-${c.id}`} challenge={c} />
            ))
        ) : (
            <div className="text-center py-16">
                <Trophy className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Completed Challenges
                </h3>
                <p className="text-gray-500">Finish a challenge to see it here!</p>
            </div>
        )}
    </div>
);
