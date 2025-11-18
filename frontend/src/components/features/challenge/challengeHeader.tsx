import { Swords } from 'lucide-react';

export const ChallengeHeader = () => (
    <div>
        <div className="flex items-center gap-3 mb-2">
            <Swords size={32} strokeWidth={2} className="text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">Challenges</h1>
        </div>
        <p className="text-gray-600 mx-6">
            Challenge your colleagues and compete on daily puzzles! 
            Challenges expire after 24 hours — finish them fast!
        </p>
    </div>
);
