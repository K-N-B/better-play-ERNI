import { WelcomeMessage } from '../components/features/welcomeMessage';
import { GamesSection } from '../components/features/games/gameSection';
import { ActivityFeedCard } from '../components/features/activityFeed/activityFeedCard';
import { LeaderboardPreviewCard } from '../components/features/leaderboard/leaderboardPreviewCard';
import { WhosOnlineCard } from '../components/features/whosOnlineCard';

export const HomePage = () => { // Use default export if that's your convention
  return (
    // Main container with padding
 <div className="container mx-auto ">

      {/* --- MAIN 3-COLUMN LAYOUT GRID --- */}
      {/* On large screens (lg:), create a 3-column grid */}
      {/* The 'grid' automatically makes columns in the same row equal height */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* --- Column 1: Welcome & Games --- */}
        {/* 'flex flex-col' allows items to stack and fill height */}
        {/* Add 'h-full' to ensure this div takes the full grid cell height */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
          <WelcomeMessage />
          {/* Add 'flex-grow' to GamesSection's *wrapper* if you want it to take remaining space */}
          <div className="grow"> {/* Wrapper to allow GamesSection to grow */}
            <GamesSection /> {/* Ensure GamesSection uses h-full internally */}
          </div>
        </div>

        {/* --- Column 2: Activity Feed --- */}
        {/* Add 'h-full' here as well */}
        <div className="lg:col-span-2 h-full">
            {/* ActivityFeedCard should have h-full internally to fill this div */}
            <ActivityFeedCard />
        </div>

        {/* --- Column 3: Leaderboard & Who's Online --- */}
        {/* Add 'h-full' and 'flex flex-col' */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
          <div className="grow"> {/* Wrapper to allow GamesSection to grow */}
            <LeaderboardPreviewCard /> {/* Ensure GamesSection uses h-full internally */}
          </div>
          <div className="grow"> {/* Wrapper to allow GamesSection to grow */}
            <WhosOnlineCard /> {/* Ensure GamesSection uses h-full internally */}
          </div>
        </div>
        {/* --- END OF MAIN LAYOUT GRID --- */}

      </div>
    </div>
  );
};
