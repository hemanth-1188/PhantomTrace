import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Cpu, Network, Radio } from "lucide-react";

export default function LandingPage({ onEnter }) {
  const [typedText, setTypedText] = useState("");
  const tagline = "Initializing PhantomTrace Realtime Network Observability Engine...";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(tagline.substring(0, i));
      i++;
      if (i > tagline.length) clearInterval(interval);
    }, 45);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-cyber-black relative overflow-hidden cyber-grid">
      
      {/* Dense accent background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-glow/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full filter blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full filter blur-[100px] animate-pulse pointer-events-none" />

      {/* Main Container */}
      <div className="z-10 text-center px-4 max-w-4xl flex flex-col items-center">
        {/* Hologram Logo */}
        <div className="relative mb-6 group">
          <div className="absolute inset-0 rounded-full bg-neon-cyan/20 blur-xl group-hover:bg-neon-purple/30 transition-all duration-700 animate-pulse" />
          <div className="relative p-6 bg-cyber-dark/80 border-2 border-neon-cyan rounded-full shadow-[0_0_25px_rgba(0,240,255,0.4)] group-hover:border-neon-purple transition-colors duration-500">
            <ShieldAlert className="h-16 w-16 text-neon-cyan group-hover:text-neon-purple transition-colors duration-500 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-cyber font-bold tracking-widest text-4xl sm:text-6xl text-white mb-2 uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]">
          PHANTOM<span className="text-neon-cyan font-light glow-cyan">TRACE</span>
        </h1>
        <p className="font-cyber font-semibold tracking-widest text-xs sm:text-sm text-neon-purple glow-purple mb-8 uppercase">
          Realtime Network Intelligence & Threat Visibility
        </p>

        {/* Console Typing Log */}
        <div className="w-full max-w-2xl bg-cyber-dark/95 border border-cyber-border rounded-lg p-4 font-mono text-left text-xs sm:text-sm text-neon-cyan shadow-2xl shadow-black/80 crt-overlay mb-8 h-16 flex items-center">
          <span className="text-neon-cyan/40 mr-2 shrink-0">&gt;</span>
          <span className="typing-cursor">{typedText}</span>
        </div>



        {/* CTA Launch Portal */}
        <button
          onClick={onEnter}
          className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-xs sm:text-sm font-bold tracking-widest font-cyber text-white rounded-lg group bg-gradient-to-br from-neon-cyan to-neon-purple group-hover:from-neon-cyan group-hover:to-neon-purple hover:text-white focus:ring-4 focus:outline-none focus:ring-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(189,0,255,0.5)] transition-all duration-300"
        >
          <span className="relative px-8 py-3.5 transition-all ease-in duration-75 bg-cyber-black rounded-md group-hover:bg-opacity-0 font-bold uppercase">
            Authorize & Enter Console
          </span>
        </button>
      </div>
      
      {/* Brand Footer */}
      <div className="absolute bottom-4 font-mono text-[10px] text-gray-600 tracking-wider">
        PHANTOMTRACE OBSERVABILITY STACK v1.0.0 // SECURE GATEWAY
      </div>
    </div>
  );
}
