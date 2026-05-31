interface SortChipProps {
  label: string;
  active?: boolean;
}

export default function SortChip({ label, active = false }: SortChipProps) {
  return (
    <button
      className={`
        shrink-0 rounded-full px-5 py-3 text-sm font-semibold
        transition-all
        ${
          active
            ? "bg-orange-400 text-white shadow-md"
            : "bg-white text-gray-800 shadow-sm"
        }
      `}
    >
      {label}
    </button>
  );
}
