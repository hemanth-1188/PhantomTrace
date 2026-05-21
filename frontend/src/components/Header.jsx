import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Wifi, WifiOff, Database, Flame, Clock } from "lucide-react";

export default function Header({ telemetry, networkInfo, onClear }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getDefconConfig = (level) => {
    switch (level) {
      case 1:
        return { text: "DEFCON 1: CRITICAL BREACH", color: "text-neon-red border-neon-red bg-neon-red/10 led-blink-red" };
      case 2:
        return { text: "DEFCON 2: HIGH THREAT", color: "text-neon-orange border-neon-orange bg-neon-orange/10 animate-pulse" };
      case 3:
        return { text: "DEFCON 3: ELEVATED ANOMALY", color: "text-yellow-400 border-yellow-400 bg-yellow-400/10" };
      case 4:
        return { text: "DEFCON 4: MINOR ALERT", color: "text-neon-cyan border-neon-cyan bg-neon-cyan/10" };
      default:
        return { text: "DEFCON 5: SYSTEM SECURE", color: "text-neon-green border-neon-green bg-neon-green/10 led-blink-green" };
    }
  };

  const defcon = getDefconConfig(telemetry?.defcon_level || 5);
  const isConnected = networkInfo?.connected !== false;
  const captureActive = networkInfo?.capture_mode === "live";

  return (
    <header className="h-16 bg-cyber-dark/80 backdrop-blur-md border-b border-cyber-border px-6 flex items-center justify-between z-10">
      {/* Ticker / Running Logs */}
      <div className="flex items-center space-x-4 overflow-hidden max-w-xl">
        <div className={`flex items-center px-3 py-1 border rounded font-cyber text-xs font-bold tracking-widest ${defcon.color}`}>
          {defcon.text}
        </div>
        <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-gray-500 max-w-sm truncate animate-pulse">
          <Flame size={12} className="text-neon-orange" />
          <span>SecOps LogStream: Live capture pipeline active.</span>
        </div>
      </div>

      {/* Connection States & Network Info */}
      <div className="flex items-center space-x-6 text-sm">
        {/* WiFi / Network Name + IP */}
        <div className="flex items-center space-x-1.5 font-cyber text-xs">
          {isConnected && captureActive ? (
            <Wifi size={14} className="text-neon-green led-blink-green" />
          ) : isConnected ? (
            <Wifi size={14} className="text-neon-orange animate-pulse" />
          ) : (
            <WifiOff size={14} className="text-neon-red animate-pulse" />
          )}
          
          {isConnected ? (
            <div className="flex items-center space-x-2">
              <span className="text-neon-green font-bold glow-green">LIVE CAPTURE</span>
              <span className="text-gray-400 font-mono text-[10px]">
                {networkInfo?.network_name || "Unknown"} • {networkInfo?.local_ip || "0.0.0.0"}
              </span>
              <span className="text-gray-500 font-mono text-[10px]">
                [{networkInfo?.interface_name || "Detecting..."}]
              </span>
            </div>
          ) : (
            <span className="text-neon-red font-bold animate-pulse">BACKEND OFFLINE</span>
          )}
        </div>

        {/* Database Health Status */}
        <div className="flex items-center space-x-1.5 font-cyber text-xs text-gray-400">
          <Database size={14} className="text-neon-cyan" />
          <span className="font-mono text-neon-cyan font-bold glow-cyan">SQLITE: ACTIVE</span>
        </div>

        {/* Dynamic Digital Clock */}
        <div className="hidden sm:flex items-center space-x-1.5 font-mono text-xs text-gray-400">
          <Clock size={14} className="text-neon-purple" />
          <span>{time}</span>
        </div>
        {/* Fresh Start Button */}
        <button 
          onClick={onClear}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-neon-red/10 border border-neon-red/30 hover:bg-neon-red/20 text-neon-red rounded text-xs font-cyber font-bold tracking-widest active:scale-95 transition-all"
          title="Delete all logs and start fresh"
        >
          <Database size={14} />
          <span>START FRESH</span>
        </button>
      </div>
    </header>
  );
}
