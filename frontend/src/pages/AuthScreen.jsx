import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import api from "../services/api";

export default function AuthScreen({ onAuthSuccess }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("phantom1337");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.login(username, password);
      if (res.success) {
        onAuthSuccess(res);
      } else {
        setError(res.message || "Invalid authentication token signatures.");
      }
    } catch (e) {
      setError("Secure gateway connection timeout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-cyber-black relative overflow-hidden cyber-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-glow/5 to-transparent pointer-events-none" />

      <div className="w-full max-w-md p-4 z-10">
        <div className="cyber-card p-8 rounded-2xl border-glow-cyan shadow-2xl relative">

          {/* Icon branding */}
          <div className="flex flex-col items-center mb-6 text-center">
            <Lock className="h-10 w-10 text-neon-cyan mb-2 animate-bounce" />
            <h2 className="font-cyber font-bold tracking-wider text-xl text-white uppercase">
              CONSOLE AUTHORIZATION
            </h2>
            <p className="text-xs text-gray-500 font-cyber mt-1">
              OPERATOR LOG-IN STACK SIGN-IN
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 font-cyber">
            {/* Username Input */}
            <div>
              <label className="block text-[10px] tracking-wider text-gray-500 uppercase font-cyber mb-1.5">
                OPERATOR CODE / IDENTIFIER
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-cyber-dark border border-cyber-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan transition-colors font-mono"
                  placeholder="e.g. admin"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] tracking-wider text-gray-500 uppercase font-cyber">
                  CYBER ENCRYPTION PHRASE
                </label>
                <span className="text-[9px] text-neon-purple font-mono">TOKEN: AES-256</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-cyber-dark border border-cyber-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan transition-colors font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-neon-red/10 border border-neon-red/30 rounded-lg text-xs text-neon-red font-mono">
                {error}
              </div>
            )}

            {/* Credentials Tip */}
            <div className="p-3 bg-cyber-gray/30 border border-cyber-border rounded-lg text-[10px] font-mono text-gray-500 leading-normal">
              <span className="text-neon-cyan font-bold block mb-0.5">DEFAULT CREDENTIALS FOR submission:</span>
              Operator Code: <span className="text-white">admin</span><br />
              Encryption Phrase: <span className="text-white">phantom1337</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span>AUTHORIZING GATEWAY...</span>
                </div>
              ) : (
                "REQUEST CONSOLE KEY"
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
