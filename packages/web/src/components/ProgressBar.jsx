export default function ProgressBar({ pct = 0, label, size = "md", color = "red" }) {
  const colors = { red: "bg-red-600", green: "bg-green-500", blue: "bg-blue-500", yellow: "bg-yellow-400" };
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" };
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span className="font-semibold text-gray-700">{pct}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} ${colors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}
