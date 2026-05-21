import React, { useState } from "react";
import { Play, Pause, Trash2, Search, Filter, ShieldAlert, Eye } from "lucide-react";

export default function PacketMonitor({ 
  packets, 
  onClear, 
  onPause, 
  onResume, 
  isPaused, 
  setSelectedPacket 
}) {
  const [search, setSearch] = useState("");
  const [filterProto, setFilterProto] = useState("ALL");

  const getProtocolColor = (proto) => {
    switch (proto) {
      case "TCP":
        return "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan";
      case "UDP":
        return "bg-neon-purple/10 border-neon-purple/30 text-neon-purple";
      case "ICMP":
        return "bg-neon-green/10 border-neon-green/30 text-neon-green";
      case "DNS":
        return "bg-neon-orange/10 border-neon-orange/30 text-neon-orange";
      case "HTTP":
        return "bg-yellow-400/10 border-yellow-400/30 text-yellow-400";
      case "SSH":
        return "bg-neon-red/10 border-neon-red/30 text-neon-red";
      default:
        return "bg-cyber-gray border-cyber-border text-gray-400";
    }
  };

  // Filter packets locally based on user configurations
  const filteredPackets = packets.filter(p => {
    const matchesSearch = 
      p.src_ip.includes(search) || 
      p.dst_ip.includes(search) || 
      p.summary.toLowerCase().includes(search.toLowerCase());
      
    const matchesProto = filterProto === "ALL" || p.protocol === filterProto;
    
    return matchesSearch && matchesProto;
  });

  return (
    <div className="p-6 space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      
      {/* Search & Controller Toolbar */}
      <div className="cyber-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        
        {/* Playback Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          {isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center space-x-2 px-4 py-2 bg-neon-green hover:bg-neon-green/90 text-black font-cyber font-bold text-xs tracking-wider rounded-lg active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)]"
            >
              <Play size={14} className="fill-black" />
              <span>ENGAGE SNIFFER</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center space-x-2 px-4 py-2 bg-neon-red hover:bg-neon-red/90 text-white font-cyber font-bold text-xs tracking-wider rounded-lg active:scale-95 transition-all shadow-[0_0_15px_rgba(255,0,85,0.2)]"
            >
              <Pause size={14} className="fill-white" />
              <span>PAUSE CAPTURE</span>
            </button>
          )}
          
          <button
            onClick={onClear}
            className="p-2 border border-cyber-border hover:border-neon-red rounded-lg text-gray-500 hover:text-neon-red hover:bg-neon-red/10 active:scale-95 transition-all"
            title="Clear capture buffer"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Input Filters */}
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Source, Destination, Summary..."
              className="w-full bg-cyber-dark border border-cyber-border rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan transition-colors font-mono"
            />
          </div>

          {/* Protocol Dropdown */}
          <div className="relative shrink-0 w-full sm:w-44">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
            <select
              value={filterProto}
              onChange={(e) => setFilterProto(e.target.value)}
              className="w-full bg-cyber-dark border border-cyber-border rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan transition-colors appearance-none font-cyber font-bold tracking-wider"
            >
              <option value="ALL">ALL PROTOCOLS</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
              <option value="DNS">DNS</option>
              <option value="HTTP">HTTP</option>
              <option value="SSH">SSH</option>
            </select>
          </div>
        </div>

      </div>

      {/* Packet Stream Grid Table */}
      <div className="cyber-card rounded-xl flex-1 overflow-hidden flex flex-col bg-cyber-dark/40">
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-cyber-gray border-b border-cyber-border font-cyber text-[10px] font-bold tracking-widest text-gray-500 uppercase shrink-0">
          <div className="col-span-1">ID</div>
          <div className="col-span-2">TIMESTAMP</div>
          <div className="col-span-1">PROTO</div>
          <div className="col-span-2">SOURCE</div>
          <div className="col-span-2">DESTINATION</div>
          <div className="col-span-1">LENGTH</div>
          <div className="col-span-3">INFO SUMMARY</div>
        </div>

        {/* Table Rows (Scrolling) */}
        <div className="flex-1 overflow-y-auto font-mono text-xs divide-y divide-cyber-border/40 select-none">
          {filteredPackets.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <span>NO PACKET CAPTURES RECORDED MATCHING THE FILTERS</span>
            </div>
          ) : (
            [...filteredPackets].reverse().map((pkt) => (
              <div
                key={pkt.id || pkt.timestamp}
                onClick={() => setSelectedPacket(pkt)}
                className={`grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-neon-cyan/5 border-l-2 cursor-pointer transition-all ${
                  pkt.is_suspicious === 1 
                    ? "border-l-neon-red bg-neon-red/5 hover:bg-neon-red/10" 
                    : "border-l-transparent"
                }`}
              >
                <div className="col-span-1 text-gray-600">#{pkt.id}</div>
                <div className="col-span-2 text-gray-500 truncate">
                  {new Date(pkt.timestamp).toLocaleTimeString([], { hour12: false })}
                </div>
                <div className="col-span-1">
                  <span className={`px-2 py-0.5 border rounded text-[9px] font-bold tracking-wide ${getProtocolColor(pkt.protocol)}`}>
                    {pkt.protocol}
                  </span>
                </div>
                <div className="col-span-2 text-neon-cyan font-bold truncate">{pkt.src_ip}</div>
                <div className="col-span-2 text-neon-purple font-bold truncate">{pkt.dst_ip}</div>
                <div className="col-span-1 text-gray-400">{pkt.length} B</div>
                
                {/* Info and Actions */}
                <div className="col-span-3 flex items-center justify-between overflow-hidden">
                  <span className="text-white truncate flex-1 mr-2">{pkt.summary}</span>
                  <div className="flex items-center space-x-1 shrink-0">
                    {pkt.is_suspicious === 1 && (
                      <ShieldAlert size={14} className="text-neon-red animate-pulse" />
                    )}
                    <Eye size={12} className="text-gray-600 hover:text-neon-cyan" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
