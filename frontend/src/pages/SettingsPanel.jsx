import React, { useState, useEffect } from "react";
import { Settings, ShieldCheck, UserCheck, ShieldAlert, Save, Loader2 } from "lucide-react";
import api from "../services/api";

export default function SettingsPanel({ onConfigChanged }) {
  const [sensitivity, setSensitivity] = useState("medium");
  const [maxLogs, setMaxLogs] = useState(5000);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await api.getSettings();
        setSensitivity(settings.ids_sensitivity || "medium");
        setMaxLogs(parseInt(settings.max_log_limit) || 5000);
      } catch (e) {
        console.error("Could not fetch settings", e);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await api.saveSettings({
        ids_sensitivity: sensitivity,
        max_log_limit: maxLogs
      });
      
      // Dynamic callback to propagate changes to WS / Parent state
      onConfigChanged(sensitivity);
      setMessage("System parameters synchronized successfully!");
      
      // Reset indicator
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage("Error updating parameters registry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)] font-cyber">
      
      {/* Top Banner Info */}
      <div className="cyber-card p-4 rounded-xl flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <Settings className="text-neon-cyan h-5 w-5 animate-pulse" />
          <div>
            <span className="font-cyber font-bold tracking-wider text-white text-sm">CONSOLE CONFIGURATION CONTROL PANEL</span>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
              Adjust IDS detection sensitivity and database retention settings.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          
          <div className="cyber-card p-6 rounded-xl space-y-5">
            <span className="font-cyber font-bold text-white text-xs tracking-widest block border-b border-cyber-border pb-3 uppercase">
              SIEM & INTRUSION DETECTION CONFIGS
            </span>

            {/* IDS Sensitivity */}
            <div>
              <label className="block text-[10px] tracking-wider text-gray-500 uppercase font-cyber mb-1.5">
                IDS Ruleset Detection Sensitivity
              </label>
              <select
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neon-cyan font-cyber font-bold tracking-wide"
              >
                <option value="low">LOW SENSITIVITY (Fewer alerts / higher speed thresholds)</option>
                <option value="medium">MEDIUM SENSITIVITY (Recommended - balanced heuristics)</option>
                <option value="high">HIGH SENSITIVITY (Aggressive checks / paranoid rules)</option>
              </select>
            </div>

            {/* DB Retention limit */}
            <div>
              <label className="block text-[10px] tracking-wider text-gray-500 uppercase font-cyber mb-1.5">
                Max SQLite Database Log Threshold
              </label>
              <input
                type="number"
                value={maxLogs}
                onChange={(e) => setMaxLogs(parseInt(e.target.value))}
                className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
                placeholder="e.g. 5000"
              />
            </div>

            {/* Live Capture Info */}
            <div className="p-3 bg-neon-green/5 border border-neon-green/20 rounded-lg text-xs font-mono text-neon-green">
              <span className="font-bold block mb-0.5">CAPTURE MODE: LIVE ONLY</span>
              <span className="text-gray-400">All packets are captured in real-time from your network adapter using Scapy + Npcap. No simulation data.</span>
            </div>

            {/* Synchronization Response Message */}
            {message && (
              <div className="p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg text-xs font-mono text-neon-green">
                {message}
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-cyber font-bold text-xs tracking-wider rounded-lg active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:brightness-110"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>SYNCHRONIZING RULES...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>SYNCHRONIZE PARAMS</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </form>

        {/* Operator profile column */}
        <div className="space-y-6">
          
          {/* Operator Profile Card */}
          <div className="cyber-card p-6 rounded-xl flex flex-col justify-between items-center text-center h-[340px]">
            <div className="space-y-3 flex flex-col items-center">
              <span className="font-cyber font-bold text-gray-500 text-xs tracking-widest uppercase mb-2">OPERATOR SECURITY CLEARANCE</span>
              <div className="relative">
                <div className="absolute inset-0 bg-neon-purple/20 rounded-full blur-md animate-pulse" />
                <div className="relative p-4 bg-cyber-dark border border-neon-purple rounded-full">
                  <UserCheck size={40} className="text-neon-purple" />
                </div>
              </div>
              <div>
                <h3 className="font-cyber font-bold text-white tracking-wide text-lg mt-2">SECOPS ADMINISTRATOR</h3>
                <span className="text-[10px] text-neon-cyan font-mono font-bold block mt-0.5">ROLE: ROOT // PRIVILEGED</span>
              </div>
            </div>
            <div className="w-full border-t border-cyber-border/40 pt-4 font-mono text-[10px] text-gray-500 text-left space-y-1">
              <div>SESSION KEY: <span className="text-white">jwt-operator-092b</span></div>
              <div>OPERATIONAL ACCESS: <span className="text-neon-green">ALL ENFORCED</span></div>
              <div>CAPTURE MODE: <span className="text-neon-green">LIVE ONLY</span></div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
