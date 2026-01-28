interface ToggleProps {
  enabled: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const EmailToggle = ({ enabled, onChange, label }: ToggleProps) => {
  return (
    <div className="flex items-center justify-between py-3">
      {label && <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
          enabled ? 'bg-[#00A651]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};