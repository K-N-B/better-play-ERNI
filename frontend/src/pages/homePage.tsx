// The main dashboard. It renders GameSuite and CommunityHub.

import { useAuth } from '../hooks/authContext';
import { GameSuite } from '../components/features/gameSuite';
import { CommunityHub } from '../components/features/communityHub';



export const HomePage = () => {
  const { user } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome, {user?.username}!</h1>
      <p>Your team: {user?.department?.name || 'Not set'}</p>

      <GameSuite />

      <div className="mt-8"> {/* Add some margin */}
        <CommunityHub /> {/* <-- ADD THE HUB */}
      </div>
    </div>
  );
};
