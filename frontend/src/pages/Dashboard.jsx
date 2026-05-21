import React, { useMemo } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { ShieldCheck, ShieldAlert, Cpu, Network, Radio, BellRing, Eye } from "lucide-react";

export default function Dashboard({ 
  packets, 
  alerts, 
  telemetry, 
  dbStats, 
  setActiveTab, 
  setSelectedPacket 
}) {
  
  // Format packet throughput history for graphing — REAL DATA ONLY
  const timelineData = useMemo(() => {
    const data = [];
    const now = Date.now();
    for (let i = 9; i >= 0; i--) {
      const timeStr = new Date(now - i * 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const count = packets.filter(p => {
        const diff = now - new Date(p.timestamp).getTime();
        return diff > i * 3000 && diff < (i + 1) * 3000;
      }).length;

      const alertCount = alerts.filter(a => {
        const diff = now - new Date(a.timestamp).getTime();
        return diff > i * 3000 && diff < (i + 1) * 3000;
      }).length;

      data.push({
        time: timeStr,
        throughput: count,
        anomalies: alertCount
      });
    }
    return data;
  }, [packets.length, alerts.length]);

  // Format protocol metrics for pie chart
  const protoData = Object.entries(dbStats?.protocol_distribution || {}).map(([key, value]) => ({
    name: key,
    value
  }));

  const COLORS = ["#00f0ff", "#bd00ff", "#00ff66", "#ff0055", "#ff9900", "#eab308", "#6366f1"];

  // Compute REAL aggregate threat score
  const threatScore = useMemo(() => {
    if (alerts.length === 0) return 0;
    
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentAlerts = alerts.filter(a => new Date(a.timestamp).getTime() > fiveMinutesAgo);
    
    if (recentAlerts.length === 0) return 0;
    
    // Weighted scoring: CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1
    const severityWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    let weightedSum = 0;
    
    recentAlerts.forEach(alert => {
      const weight = severityWeights[alert.severity] || 1;
      const score = alert.threat_score || 0;
      weightedSum += score * weight;
    });
    
    // Normalize: divide by a factor to get 0-100 range
    // With normalization factor = max_possible_single_alert * expected_alert_count
    const normalizedScore = Math.min(100, Math.round(weightedSum / (95 * 4) * 100));
    return normalizedScore;
  }, [alerts]);

  const getThreatColor = (score) => {
    if (score >= 70) return "text-neon-red glow-red";
    if (score >= 40) return "text-neon-orange";
    if (score >= 10) return "text-yellow-400";
    return "text-neon-green glow-green";
  };

  // Sort and isolate top talker IPs
  const topTalkers = useMemo(() => {
    const talkers = {};
    packets.forEach(p => {
      talkers[p.src_ip] = (talkers[p.src_ip] || 0) + 1;
    });
    return Object.entries(talkers)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [packets.length]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
      
      {/* Dynamic Header Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Packets Sniffed Widget */}
        <div className="cyber-card p-4 rounded-xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-neon-cyan w-full animate-pulse" />
          <div>
            <span className="text-gray-500 text-[10px] tracking-wider font-cyber uppercase block mb-1">TOTAL INGRESS TRAFFIC</span>
            <span className="text-2xl font-mono text-white font-bold glow-cyan">
              {dbStats?.total_packets || packets.length}
            </span>
            <span className="text-[10px] text-neon-cyan font-mono block mt-1">Live packets captured</span>
          </div>
          <Network className="text-neon-cyan h-8 w-8 opacity-80" />
        </div>

        {/* Capture Rate Widget */}
        <div className="cyber-card p-4 rounded-xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-neon-green w-full animate-pulse" />
          <div>
            <span className="text-gray-500 text-[10px] tracking-wider font-cyber uppercase block mb-1">REALTIME CAPTURE RATE</span>
            <span className="text-2xl font-mono text-neon-green font-bold glow-green">
              {telemetry?.packet_rate || 0.0} <span className="text-xs">pps</span>
            </span>
            <span className="text-[10px] text-gray-500 font-mono block mt-1">Packets per second</span>
          </div>
          <Radio className="text-neon-green h-8 w-8 opacity-80 animate-pulse" />
        </div>

        {/* Alerts Logged Widget */}
        <div className="cyber-card p-4 rounded-xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-neon-red w-full animate-pulse" />
          <div>
            <span className="text-gray-500 text-[10px] tracking-wider font-cyber uppercase block mb-1">LIFETIME INTRUSIONS LOGGED</span>
            <span className={`text-2xl font-mono font-bold ${dbStats?.total_alerts > 0 ? "text-neon-red glow-red" : "text-gray-400"}`}>
              {dbStats?.total_alerts || 0}
            </span>
            <span className="text-[10px] text-neon-red font-mono block mt-1">
              {dbStats?.critical_alerts || 0} critical signatures
            </span>
          </div>
          <ShieldAlert className={`h-8 w-8 opacity-80 ${dbStats?.total_alerts > 0 ? "text-neon-red animate-pulse" : "text-gray-500"}`} />
        </div>

        {/* Threat Score Widget */}
        <div className="cyber-card p-4 rounded-xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-neon-purple w-full animate-pulse" />
          <div>
            <span className="text-gray-500 text-[10px] tracking-wider font-cyber uppercase block mb-1">SYSTEM THREAT LEVEL</span>
            <span className={`text-2xl font-mono font-bold ${getThreatColor(threatScore)}`}>
              {threatScore}<span className="text-xs">/100</span>
            </span>
            <span className="text-[10px] text-neon-purple font-mono block mt-1">
              {threatScore >= 70 ? "CRITICAL RISK" : threatScore >= 40 ? "ELEVATED RISK" : threatScore >= 10 ? "LOW RISK" : "SECURE"}
            </span>
          </div>
          <Cpu className={`h-8 w-8 opacity-80 ${getThreatColor(threatScore)}`} />
        </div>

      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Packet Throughput Line Chart */}
        <div className="cyber-card p-5 rounded-xl lg:col-span-2 flex flex-col justify-between h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-cyber font-bold tracking-wider text-white text-sm">LIVE THROUGHPUT TIMELINE</span>
            <span className="text-[10px] font-mono text-neon-cyan">REAL PACKETS/3s WINDOW</span>
          </div>
          <div className="flex-1 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff0055" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ff0055" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#2e303a" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#2e303a" tick={{ fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0d0e14", borderColor: "rgba(0, 240, 255, 0.2)", borderRadius: "8px" }} 
                  labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="throughput" name="Packets Captured" stroke="#00f0ff" fillOpacity={1} fill="url(#colorThroughput)" />
                <Area type="monotone" dataKey="anomalies" name="Threats Detected" stroke="#ff0055" fillOpacity={1} fill="url(#colorAnomalies)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Distribution & Threat Score */}
        <div className="cyber-card p-5 rounded-xl h-[380px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="font-cyber font-bold tracking-wider text-white text-sm">PROTOCOL DISTRIBUTION</span>
            <span className="text-[10px] font-mono text-neon-purple">REAL DATA</span>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            {protoData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={protoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {protoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0d0e14", borderColor: "rgba(189, 0, 255, 0.2)", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-gray-500 text-xs font-mono">Waiting for packets...</span>
            )}
            
            {/* Absolute overlay of threat score */}
            <div className="absolute flex flex-col items-center justify-center font-cyber">
              <span className="text-gray-500 text-[9px] uppercase tracking-widest">THREAT SCORE</span>
              <span className={`text-3xl font-mono font-bold ${getThreatColor(threatScore)}`}>
                {threatScore}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1 mt-2 text-center text-[10px] font-mono">
            {protoData.slice(0, 5).map((entry, index) => (
              <div key={entry.name}>
                <span className="block font-bold" style={{ color: COLORS[index % COLORS.length] }}>{entry.name}</span>
                <span className="text-gray-500">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Streaming Alerts Ticker & Top communicating IPs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* IDS Alarms Ticker */}
        <div className="cyber-card p-5 rounded-xl lg:col-span-2 h-[340px] flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-cyber-border pb-3 shrink-0">
            <div className="flex items-center space-x-2">
              <BellRing className="text-neon-red h-4 w-4 animate-bounce" />
              <span className="font-cyber font-bold tracking-wider text-white text-sm">SECURITY OPERATIONS CENTER TICKER</span>
            </div>
            <button 
              onClick={() => setActiveTab("threats")}
              className="text-[10px] text-neon-cyan hover:underline font-mono"
            >
              VIEW ALL ALERTS
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-1">
            {alerts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <ShieldCheck className="text-neon-green h-8 w-8 mr-2" />
                <span>NO THREATS DETECTED — NETWORK TRAFFIC IS CLEAN</span>
              </div>
            ) : (
              alerts.map((alert) => (
                <div 
                  key={alert.id || alert.timestamp}
                  className={`p-2.5 rounded-lg border flex items-center justify-between bg-cyber-dark/40 ${
                    alert.severity === "CRITICAL" ? "border-neon-red/30 bg-neon-red/5" :
                    alert.severity === "HIGH" ? "border-neon-orange/30" : "border-cyber-border"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        alert.severity === "CRITICAL" ? "bg-neon-red text-white" :
                        alert.severity === "HIGH" ? "bg-neon-orange text-black" : "bg-cyber-gray text-gray-400"
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-gray-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      <span className="text-white font-bold text-[11px] truncate max-w-sm">{alert.category}</span>
                    </div>
                    <p className="text-gray-400 text-[11px]">{alert.message}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 block text-[9px]">SOURCE</span>
                    <span className="text-neon-cyan font-bold">{alert.src_ip}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Communicating Host Grid */}
        <div className="cyber-card p-5 rounded-xl h-[340px] flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-cyber-border pb-3 shrink-0">
            <span className="font-cyber font-bold tracking-wider text-white text-sm">TOP TALKER MATRIX</span>
            <span className="text-[10px] font-mono text-neon-cyan">LIVE COUNTS</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1">
            {topTalkers.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <span>Waiting for live traffic...</span>
              </div>
            ) : (
              topTalkers.map((talker, idx) => (
                <div key={talker.ip} className="flex items-center justify-between p-2 hover:bg-cyber-gray/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-neon-purple font-bold text-sm w-4">#{idx + 1}</span>
                    <span className="text-white text-xs">{talker.ip}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-cyber-gray h-1.5 rounded-full overflow-hidden hidden sm:block">
                      <div 
                        className="bg-neon-cyan h-full" 
                        style={{ width: `${Math.min(100, (talker.count / topTalkers[0].count) * 100)}%` }} 
                      />
                    </div>
                    <span className="text-neon-cyan font-bold w-12 text-right">{talker.count}</span>
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
