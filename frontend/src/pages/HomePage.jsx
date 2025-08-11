import { useState } from "react";
import { Target, Zap, Trophy, Users, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Homepage() {
  const navigate = useNavigate();
  const [hoveredMode, setHoveredMode] = useState(null);

  const handleNavigation = (path) => {
    navigate(path); // Uncomment this line
    console.log(`Navigating to: ${path}`);
  };

  const gameModes = [
    {
      id: "practice",
      title: "Practice Mode",
      info: "Practice your solves before battling!",
      icon: Target,
      path: "/practice-mode",
      color: "blue",
    },
    {
      id: "battles",
      title: "Daily Battles",
      info: "Create or Join rooms to battle friends!",
      icon: Trophy,
      path: "/battles-home",
      color: "green",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-blue-500 via-green-800 to-gray-500 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-2xl mb-6">
            <img
              src="/logo.png"
              alt="Speedcube Battles Logo"
              className="mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-full shadow-lg"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Choose Game Mode
          </h1>
          <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto">
            Ready to test your cubing skills? Select your preferred way to play
          </p>
        </div>

        {/* Game Mode Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {gameModes.map((mode) => {
            const IconComponent = mode.icon;
            const isHovered = hoveredMode === mode.id;

            return (
              <div
                key={mode.id}
                className="group relative"
                onMouseEnter={() => setHoveredMode(mode.id)}
                onMouseLeave={() => setHoveredMode(null)}
              >
                <div
                  className={`
                    bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700
                    p-8 sm:p-10 transition-all duration-300 cursor-pointer
                    ${isHovered ? "transform -translate-y-2 shadow-3xl" : ""}
                    ${
                      mode.color === "blue"
                        ? "hover:border-blue-500/50"
                        : "hover:border-green-500/50"
                    }
                    relative overflow-hidden
                  `}
                  onClick={() => handleNavigation(mode.path)}
                  onTouchStart={() => setHoveredMode(mode.id)}
                >
                  {/* Background Gradient Effect */}
                  <div
                    className={`
                    absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300
                    ${
                      mode.color === "blue"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                        : "bg-gradient-to-br from-green-500 to-green-600"
                    }
                  `}
                  />

                  {/* Icon */}
                  <div
                    className={`
                    inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6
                    ${
                      mode.color === "blue"
                        ? "bg-blue-600/20 text-blue-400"
                        : "bg-green-600/20 text-green-400"
                    }
                    group-hover:scale-110 transition-transform duration-300
                  `}
                  >
                    <IconComponent className="w-8 h-8" />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 group-hover:text-white transition-colors duration-300">
                    {mode.title}
                  </h2>

                  {/* Info */}
                  <p className="text-gray-300 text-lg sm:text- max-w-2xl mx-auto mb-4">
                    {mode.info}
                  </p>

                  {/* Action Button */}
                  <button
                    className={`
                    w-full font-semibold py-4 px-6 rounded-xl transition-all duration-300
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800
                    shadow-lg group-hover:shadow-xl transform group-hover:scale-105
                    text-base sm:text-lg
                    ${
                      mode.color === "blue"
                        ? "bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-400"
                        : "bg-green-600 hover:bg-green-500 text-white focus:ring-green-400"
                    }
                  `}
                  >
                    {mode.title === "Practice Mode"
                      ? "Start Practicing"
                      : "Join Battle"}
                  </button>

                  {/* Corner Accent */}
                  <div
                    className={`
                    absolute top-4 right-4 w-3 h-3 rounded-full opacity-50
                    ${mode.color === "blue" ? "bg-blue-400" : "bg-green-400"}
                    group-hover:opacity-100 group-hover:scale-150 transition-all duration-300
                  `}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
