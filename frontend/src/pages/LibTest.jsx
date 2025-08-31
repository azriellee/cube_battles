import { getScramble } from "../services/scramble";

export default function LibTest() {
  const scramble = getScramble({ type: "3x3" });

  return (
    <div className="min-h-screen bg-white grid place-items-center p-6">
      <div className="mb-4 font-mono text-lg text-black">{scramble}</div>
      {/* Web Component: React will render this as-is */}
      <scramble-display
        scramble={scramble}
        style={{ display: "block", width: 384, height: 256 }}
      ></scramble-display>
    </div>
  );
}
