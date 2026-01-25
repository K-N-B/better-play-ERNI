import { useState } from 'react';
import { WelcomeMessage } from '../components/features/welcomeMessage';
import { GamesSection } from '../components/features/games/gameSection';
import { ActivityFeedCard } from '../components/features/activityFeed/activityFeedCard';
import { LeaderboardPreviewCard } from '../components/features/leaderboard/leaderboardPreviewCard';
import { WhosOnlineCard } from '../components/features/whosOnlineCard';
import { WhosOnlineList } from '../components/features/whosOnlineList';
import { Users } from 'lucide-react';
import { GamesStrip } from '../components/features/games/gamesStrip';
import { StreakWidget } from '../components/features/streak/streakWidget';


export const HomePage = () => {
  const [showWhosOnline, setShowWhosOnline] = useState(false);

  return (
    <div className="container mx-auto px-4">
      {/* --- MOBILE LAYOUT --- */}
      <div className="block lg:hidden space-y-6">
        {/* Welcome Message */}
        <div>
          <StreakWidget />
          <WelcomeMessage />
        </div>

        {/* Games Section */}
        <div>
          <GamesStrip />
        </div>

        {/* Activity Feed with Who's Online button */}
        <div className="relative">
          <ActivityFeedCard />

          <button
            className="absolute top-4 right-4 bg-sky-200 text-primary-600 p-3 rounded-full shadow-[0_3px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-0.5 active:translate-y-1 transition-all"
            onClick={() => setShowWhosOnline(!showWhosOnline)}
          >
            <Users size={22} strokeWidth={2.5} />
          </button>

          {showWhosOnline && (
            <div className="absolute top-20 right-4 w-64 bg-white shadow-lg rounded-lg p-4 z-20max-h-96 overflow-y-auto">
              <WhosOnlineList /> {/* only list, no header */}
            </div>
          )}
        </div>

      </div>

      {/* --- DESKTOP LAYOUT (3-column) --- */}
      <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6 lg:min-h-screen">
        {/* Column 1 */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
          <StreakWidget streak={5}/>
          <WelcomeMessage />
          <div>
            <GamesSection />
          </div>
        </div>

        {/* Column 2 */}
        <div className="lg:col-span-2 h-full">
          <ActivityFeedCard />
        </div>

        {/* Column 3 */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
          <div>
            <LeaderboardPreviewCard />
          </div>
          <div>
            <WhosOnlineCard />
          </div>
        </div>
      </div>
    </div>
  );
};
