import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Chrome, User } from "lucide-react";
import {
  doSignInWithEmailAndPassword,
  doCreateUserWithEmailAndPassword,
  doSignInWithGoogle,
  doPasswordReset,
} from "../firebase/auth";
import { updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  createPlayer,
  getPlayerDetails,
  updatePlayerDetails,
} from "../services/api";

export default function SignInPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return false;
    }
    if (isSignUp && (!playerName || playerName.trim().length < 2)) {
      setError("Player name must be at least 2 characters");
      return false;
    }
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords don't match");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isSignUp) {
        // Create Firebase user
        const userCredential = await doCreateUserWithEmailAndPassword(
          email,
          password
        );

        // Update Firebase displayName
        await updateProfile(userCredential.user, {
          displayName: playerName.trim(),
        });

        // Create player in your database
        await createPlayer(playerName.trim(), userCredential.user.email);

        console.log("Registration successful");
      } else {
        await doSignInWithEmailAndPassword(email, password);
        console.log("Sign in successful");
      }

      // Redirect to home or dashboard
      navigate("/");
    } catch (err) {
      console.error("Authentication error:", err);

      // Handle specific error cases
      if (err.message?.includes("email-already-in-use")) {
        setError("An account with this email already exists");
      } else if (err.message?.includes("invalid-email")) {
        setError("Please enter a valid email address");
      } else if (err.message?.includes("weak-password")) {
        setError("Password should be at least 6 characters");
      } else if (err.message?.includes("user-not-found")) {
        setError("No account found with this email");
      } else if (err.message?.includes("wrong-password")) {
        setError("Incorrect password");
      } else if (
        err.message?.includes("Player with this email or name already exists")
      ) {
        setError("A player with this email or username already exists");
      } else {
        setError(err.message || "Authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await doSignInWithGoogle();

      // Use the user from the sign-in result
      const user = result?.user;
      if (user) {
        try {
          // Check if player exists first
          const existingPlayer = await getPlayerDetails(user.displayName);
          if (!existingPlayer) {
            // Only create if player doesn't exist
            const playerName = user.displayName || user.email.split("@")[0];
            await createPlayer(playerName, user.email);

            console.log("New player profile created");
          } else {
            console.log(
              "Existing player signed in:",
              existingPlayer.playerName
            );
          }
        } catch (err) {
          // Only show error if it's not about player existing
          if (!err.message?.includes("already exists")) {
            console.error("Player profile error:", err);
            setError("Failed to setup player profile");
            return; // Don't navigate if there's a real error
          }
        }
      }

      // Redirect to home or dashboard
      navigate("/");
      console.log("Google sign in successful");
    } catch (err) {
      console.error("Google sign in error:", err);
      setError(err.message || "Google sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      await doPasswordReset(email);
      setResetEmailSent(true);
      setShowPasswordReset(false);
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-green-800 to-gray-500 flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Speedcube Battles Logo"
            className="mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-full shadow-lg"
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Cube Battles
          </h1>
          <p className="text-gray-300 text-base sm:text-lg">
            {isSignUp
              ? "Create your account"
              : "Battle your friends in Rubik's cube solving!"}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            {error}
          </div>
        )}

        {resetEmailSent && (
          <div className="bg-green-900/50 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            Password reset email sent! Check your inbox.
          </div>
        )}

        {showPasswordReset ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 text-center">
                Reset Password
              </h2>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                         text-white placeholder-gray-400 backdrop-blur-sm transition duration-200"
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400/50 
                     text-white font-semibold py-4 px-4 rounded-xl transition duration-200
                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800
                     shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {isLoading ? "Sending..." : "Send Reset Email"}
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordReset(false)}
              className="w-full text-gray-400 hover:text-white transition duration-200 py-2"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Player Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Choose your player name"
                      className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl 
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                             text-white placeholder-gray-400 backdrop-blur-sm transition duration-200"
                      disabled={isLoading}
                      maxLength={30}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    This will be your display name in battles
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                           text-white placeholder-gray-400 backdrop-blur-sm transition duration-200"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-4 bg-gray-700/50 border border-gray-600 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                           text-white placeholder-gray-400 backdrop-blur-sm transition duration-200"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-12 pr-12 py-4 bg-gray-700/50 border border-gray-600 rounded-xl 
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                             text-white placeholder-gray-400 backdrop-blur-sm transition duration-200"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition duration-200"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleEmailAuth}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400/50 
                       text-white font-semibold py-4 px-4 rounded-xl transition duration-200
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800
                       shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none
                       text-base sm:text-lg"
              >
                {isLoading
                  ? "Loading..."
                  : isSignUp
                  ? "Create Account"
                  : "Sign In"}
              </button>
            </div>

            {!isSignUp && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowPasswordReset(true)}
                  className="text-gray-400 hover:text-white transition duration-200 text-sm"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-600"></div>
              <span className="px-4 text-gray-400 text-sm font-medium">OR</span>
              <div className="flex-1 border-t border-gray-600"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white/10 hover:bg-white/20 disabled:bg-white/5 
                     text-white font-semibold py-4 px-4 rounded-xl transition duration-200
                     focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-gray-800
                     shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none
                     text-base sm:text-lg border border-white/20 flex items-center justify-center gap-3"
            >
              <Chrome className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="text-center mt-6 text-sm text-gray-400">
              {isSignUp ? (
                <p>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setIsSignUp(false);
                      setPlayerName("");
                      setConfirmPassword("");
                      setError("");
                    }}
                    className="text-blue-400 hover:text-blue-300 transition duration-200 font-medium"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{" "}
                  <button
                    onClick={() => {
                      setIsSignUp(true);
                      setError("");
                    }}
                    className="text-blue-400 hover:text-blue-300 transition duration-200 font-medium"
                  >
                    Sign Up
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
