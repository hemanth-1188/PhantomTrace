import React from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity } from "lucide-react";

export default function AnalyticsPage({ packets, dbStats }) {
  
  // Format data for protocol distribution bar chart from LIVE packets
  const getProtocolDistribution = () => {
    const dist = {};
    packets.forEach(p => {
      dist[p.protocol] = (dist[p.protocol] || 0) + 1;
    });
    if (Object.keys(dist).length === 0) {
      return [{ protocol: "TCP", packets: 0 }, { protocol: "UDP", packets: 0 }];
    }
    return Object.entries(dist).map(([key, value]) => ({
      protocol: key,
      packets: value
    }));
  };

  // Format data for packet size distribution (grouped by size bracket)
  const getPacketSizeData = () => {
    const brackets = {
      "0-128 B": 0,
      "129-512 B": 0,
      "513-1024 B": 0,
      "1025-1500 B": 0,
      "1500+ B": 0
    };

    packets.forEach(p => {
      const len = p.length;
      if (len <= 128) brackets["0-128 B"]++;
      else if (len <= 512) brackets["129-512 B"]++;
      else if (len <= 1024) brackets["513-1024 B"]++;
      else if (len <= 1500) brackets["1025-1500 B"]++;
      else brackets["1500+ B"]++;
    });

    return Object.entries(brackets).map(([name, count]) => ({ name, count }));
  };

  // Format active flows (Source -> Destination count)
  const getFlowMatrix = () => {
    const flows = {};
    packets.slice(-100).forEach(p => {
      const path = `${p.src_ip} -> ${p.dst_ip}`;
      flows[path] = (flows[path] || 0) + 1;
    });

    return Object.entries(flows)
      .map(([link, count]) => ({ link, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  };

  const protocolData = getProtocolDistribution();
  const sizeData = getPacketSizeData();
  const flowMatrix = getFlowMatrix();

  const COLORS = ["#00f0ff", "#bd00ff", "#00ff66", "#ff9900", "#ff0055"];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
      
      {/* Top Banner Info */}
      <div className="cyber-card p-4 rounded-xl flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <BarChart3 className="text-neon-cyan h-5 w-5 animate-pulse" />
          <div>
            <span className="font-cyber font-bold tracking-wider text-white text-sm">TRAFFIC METRICS ANALYTICS PANEL</span>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
              Extended diagnostics of packet payloads sizes, throughput spikes, and OSI flow vectors.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Protocol Ingress Frequency Bar */}
        <div className="cyber-card p-5 rounded-xl h-[330px] flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-cyber-border pb-3 shrink-0">
            <span className="font-cyber font-bold tracking-wider text-white text-xs uppercase">OSI PROTOCOL DENSITY FREQUENCY</span>
            <span className="text-[9px] font-mono text-neon-cyan">PACKET COUNTS</span>
          </div>
          <div className="flex-1 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={protocolData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#161722" />
                <XAxis dataKey="protocol" stroke="#2e303a" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#2e303a" tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 240, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: "#0d0e14", borderColor: "rgba(0, 240, 255, 0.2)", borderRadius: "8px" }}
                />
                <Bar dataKey="packets" fill="#bd00ff">
                  {protocolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Packet Size Brackets Pie Chart */}
        <div className="cyber-card p-5 rounded-xl h-[330px] flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-cyber-border pb-3 shrink-0">
            <span className="font-cyber font-bold tracking-wider text-white text-xs uppercase">PACKET LENGTH SIZE DEMOGRAPHICS</span>
            <span className="text-[9px] font-mono text-neon-purple">MTU LIMITS</span>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={sizeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="count"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: '#2e303a' }}
                >
                  {sizeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0d0e14", borderColor: "rgba(189, 0, 255, 0.2)", borderRadius: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Secondary Flows Matrix Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Flow Vectors Spikes */}
        <div className="cyber-card p-5 rounded-xl lg:col-span-2 h-[340px] flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-cyber-border pb-3 shrink-0">
            <span className="font-cyber font-bold tracking-wider text-white text-xs uppercase">DATA TRANSMISSION OVERHEAD RATE</span>
            <span className="text-[9px] font-mono text-neon-green">BYTES/S MONITOR</span>
          </div>
          <div className="flex-1 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={protocolData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#161722" />
                <XAxis dataKey="protocol" stroke="#2e303a" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#2e303a" tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0d0e14", borderColor: "rgba(0, 255, 102, 0.2)", borderRadius: "8px" }}
                />
                <Line type="monotone" dataKey="packets" name="Payload rate" stroke="#00ff66" strokeWidth={2} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Flows Matrix Table */}
        <div className="cyber-card p-5 rounded-xl h-[340px] flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-cyber-border pb-3 shrink-0">
            <span className="font-cyber font-bold tracking-wider text-white text-xs uppercase">TALKATIVE PATH CHANNELS</span>
            <span className="text-[9px] font-mono text-neon-cyan">FLUX</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-[11px] pr-1">
            {flowMatrix.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <span>No flows identified...</span>
              </div>
            ) : (
              flowMatrix.map((flow, idx) => (
                <div key={flow.link} className="p-2.5 bg-cyber-dark/40 border border-cyber-border/40 hover:border-cyber-border rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[70%]">
                    <span className="text-gray-500 text-[8px] block">LINK CHANNEL #{idx + 1}</span>
                    <span className="text-white font-bold truncate block">{flow.link}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 text-[8px] block">CONNS</span>
                    <span className="text-neon-cyan font-bold glow-cyan">{flow.count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
