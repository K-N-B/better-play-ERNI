import { WhosOnline } from './whosOnline'; // Your existing component

export const WhosOnlineCard = () => {
    return (
        <div className="bg-white p-6 rounded-4xl shadow-md border border-gray-100 h-full">
             {/* Embed the existing WhosOnline component */}
             <WhosOnline />
        </div>
    );
};