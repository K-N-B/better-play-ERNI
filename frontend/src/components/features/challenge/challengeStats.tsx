export const ChallengeStats = ({ active, expired, won, total }: any) => (
    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">

            <StatCard color="blue" label="Active" value={active} />
            <StatCard color="orange" label="Expired" value={expired} />
            <StatCard color="green" label="Won" value={won} />
            <StatCard color="purple" label="Total" value={total} />

        </div>
    </div>
);

const StatCard = ({ value, label, color }: any) => (
    <div className="bg-white rounded-lg p-3 shadow-sm">
        <div className={`text-2xl font-bold text-${color}-600`}>
            {value}
        </div>
        <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
);
