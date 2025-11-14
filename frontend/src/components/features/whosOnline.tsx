import { Users } from 'lucide-react';
import { WhosOnlineList } from './whosOnlineList';

export const WhosOnline = () => {
  return (
    <div className="h-full">
      <h3 className="text-2xl font-semibold mb-3 flex items-center space-x-2">
        <Users size={22} strokeWidth={2.5} />
        <span>Who's Online</span>
      </h3>
      <WhosOnlineList />
    </div>
  );
};
