import React from "react";
import { Cpu, HardDrive, Database, Network, Wifi } from "lucide-react";

export default function SystemStatus({ telemetry, networkInfo }) {
  
  const cpu = telemetry?.cpu_usage || 0;
  const ram = telemetry?.ram_usage || 0;
  const disk = telemetry?.disk_free_percent || 100;
  const dbSize = telemetry?.database_size_kb || 0.0;
  const connections = telemetry?.active_connections || 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
      
      {/* Top Banner */}
      <div className="cyber-card p-4 rounded-xl flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <Cpu className="text-neon-cyan h-5 w-5 animate-pulse" />
          <div>
            <span className="font-cyber font-bold tracking-wider text-white text-sm">HARDWARE & TELEMETRY REGISTRY</span>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
              Physical node diagnostics, active memory allocations, and socket broadcast telemetry.
            </p>
          </div>
        </div>
      </div>

      {/* Hardware metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CPU utilization dial */}
        <div className="cyber-card p-5 rounded-xl text-center flex flex-col justify-between items-center h-[280px]">
          <div className="flex items-center space-x-1.5 font-cyber font-bold text-xs tracking-wider text-white">
            <Cpu size={14} className="text-neon-cyan" />
            <span>OPERATOR CPU CORE FREQ</span>
          </div>
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#161722" strokeWidth="6" />
              <circle 
                cx="50" cy="50" r="40" fill="transparent" stroke="#00f0ff" strokeWidth="6"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * cpu) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 glow-cyan"
              />
            </svg>
            <div className="absolute font-mono text-2xl text-white font-bold">{cpu}%</div>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">Realtime processor load</span>
        </div>

        {/* RAM allocation dial */}
        <div className="cyber-card p-5 rounded-xl text-center flex flex-col justify-between items-center h-[280px]">
          <div className="flex items-center space-x-1.5 font-cyber font-bold text-xs tracking-wider text-white">
            <Database size={14} className="text-neon-purple" />
            <span>VIRTUAL MEMORY ALLOCATION</span>
          </div>
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#161722" strokeWidth="6" />
              <circle 
                cx="50" cy="50" r="40" fill="transparent" stroke="#bd00ff" strokeWidth="6"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * ram) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 glow-purple"
              />
            </svg>
            <div className="absolute font-mono text-2xl text-white font-bold">{ram}%</div>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">DDR RAM consumption</span>
        </div>

        {/* Disk space remaining dial */}
        <div className="cyber-card p-5 rounded-xl text-center flex flex-col justify-between items-center h-[280px]">
          <div className="flex items-center space-x-1.5 font-cyber font-bold text-xs tracking-wider text-white">
            <HardDrive size={14} className="text-neon-green" />
            <span>PARTITION CAPACITY MON</span>
          </div>
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#161722" strokeWidth="6" />
              <circle 
                cx="50" cy="50" r="40" fill="transparent" stroke="#00ff66" strokeWidth="6"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * disk) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 glow-green"
              />
            </svg>
            <div className="absolute font-mono text-2xl text-white font-bold">{disk}%</div>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">Free block space</span>
        </div>

      </div>

      {/* Network & Database diagnostic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Active Network Interface Info */}
        <div className="cyber-card p-5 rounded-xl space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <span className="font-cyber font-bold tracking-wider text-white text-sm">NETWORK INTERFACE</span>
            <span className="text-neon-green text-[10px] font-bold">LIVE CAPTURE</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">ADAPTER NAME</span>
              <span className="text-white">{networkInfo?.interface_name || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">WIFI NETWORK (SSID)</span>
              <span className="text-neon-green font-bold glow-green">{networkInfo?.network_name || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">LOCAL IP ADDRESS</span>
              <span className="text-neon-cyan font-bold glow-cyan">{networkInfo?.local_ip || "0.0.0.0"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CAPTURE MODE</span>
              <span className="text-neon-green font-bold">{networkInfo?.capture_mode === "live" ? "LIVE SNIFFER" : "ERROR"}</span>
            </div>
          </div>
        </div>
        
        {/* Active Database file status */}
        <div className="cyber-card p-5 rounded-xl space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <span className="font-cyber font-bold tracking-wider text-white text-sm">DATABASE FILE REGISTRY</span>
            <span className="text-neon-cyan text-[10px] font-bold">SQLITE 3</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">DATABASE PATH</span>
              <span className="text-white">backend/phantomtrace.db</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">REGISTRY FILE SIZE</span>
              <span className="text-neon-cyan font-bold glow-cyan">{dbSize} KB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">DATABASE HEALTH ADAPTER</span>
              <span className="text-neon-green font-bold glow-green">OPTIMIZED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">LOG RETENTION SCHEME</span>
              <span className="text-white">MAX 5,000 CYCLES (Rolling)</span>
            </div>
          </div>
        </div>

        {/* WebSocket active channels status */}
        <div className="cyber-card p-5 rounded-xl space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <span className="font-cyber font-bold tracking-wider text-white text-sm">SOCKET TUNNEL REGISTRY</span>
            <span className="text-neon-purple text-[10px] font-bold">WEBSOCKETS</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">SOCKET ENDPOINT ADDRESS</span>
              <span className="text-white">ws://localhost:8000/ws/traffic</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ACTIVE CHANNELS SUBSCRIBED</span>
              <span className="text-neon-purple font-bold glow-purple">{connections} listeners</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CONNECTION STATUS</span>
              <span className={`font-bold ${networkInfo?.connected !== false ? "text-neon-green glow-green" : "text-neon-red"}`}>
                {networkInfo?.connected !== false ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">BROADCAST THROTTLING LIMIT</span>
              <span className="text-white">50 packets / frames per batch</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
