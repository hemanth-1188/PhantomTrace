import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, ShieldOff, Play } from "lucide-react";

export default function ThreatCenter({ alerts, dbStats }) {
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [rules, setRules] = useState([
    { id: 1, name: "PORT_SCAN_DETECTION", desc: "Detects 5+ distinct port scans from a single IP within 10s.", status: "ENFORCED", severity: "MEDIUM" },
    { id: 2, name: "SYN_FLOOD_MITIGATION", desc: "Monitors SYN packet transmission rate. Flags high volume DDoS floods.", status: "ENFORCED", severity: "CRITICAL" },
    { id: 3, name: "SQL_INJECTION_SHIELD", desc: "Performs deep application payload inspection for WAF SQL injection signatures.", status: "ENFORCED", severity: "HIGH" },
    { id: 4, name: "SSH_BRUTE_FORCE_SIEM", desc: "Tracks failed authentication attempts querying port 22.", status: "ENFORCED", severity: "HIGH" },
    { id: 5, name: "IP_REPUTATION_DATABASE", desc: "Matches incoming packets against known TOR exit nodes and spam-source lists.", status: "ENFORCED", severity: "LOW" }
  ]);

  const toggleRule = (id) => {
    setRules(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, status: r.status === "ENFORCED" ? "BYPASSED" : "ENFORCED" };
      }
      return r;
    }));
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-neon-red text-white border-neon-red/30 glow-red animate-pulse";
      case "HIGH":
        return "bg-neon-orange text-black border-neon-orange/30";
      case "MEDIUM":
        return "bg-yellow-500 text-black border-yellow-500/30";
      case "LOW":
        return "bg-neon-cyan text-black border-neon-cyan/30";
      default:
        return "bg-cyber-gray text-gray-400 border-cyber-border";
    }
  };

  const filteredAlerts = alerts.filter(a => {
    return severityFilter === "ALL" || a.severity === severityFilter;
  });

  // Calculate true maximum threat score for the dial
  const maxThreatScore = alerts.length > 0 ? Math.max(...alerts.map(a => a.threat_score || 0)) : 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
      
      {/* Risk Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Risk Level Radial Gauge */}
        <div className="cyber-card p-5 rounded-xl text-center flex flex-col justify-between items-center h-[260px]">
          <span className="font-cyber font-bold tracking-wider text-white text-xs uppercase mb-2">SYSTEM RISK INDEX</span>
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Pulsing visual circles */}
            <div className={`absolute inset-0 rounded-full border-4 border-dashed animate-spin ${
              maxThreatScore > 75 ? "border-neon-red/20" : "border-neon-cyan/20"
            }`} style={{ animationDuration: '30s' }} />
            <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center ${
              maxThreatScore > 75 ? "border-neon-red/60 shadow-[0_0_15px_rgba(255,0,85,0.2)]" : "border-neon-cyan/40 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
            }`}>
              <span className={`text-4xl font-mono font-bold ${maxThreatScore > 75 ? "text-neon-red glow-red" : "text-neon-cyan glow-cyan"}`}>
                {maxThreatScore}%
              </span>
              <span className="text-[9px] text-gray-500 font-cyber font-semibold tracking-wider mt-0.5">MAX SEVERITY</span>
            </div>
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-1">IDS signatures validated</span>
        </div>

        {/* Severity Metrics Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4 h-full">
          {/* Critical Indicator */}
          <div className="cyber-card p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 bg-neon-red animate-pulse" />
            <div>
              <span className="text-gray-500 text-[10px] tracking-wider font-cyber block mb-1">CRITICAL ALERTS</span>
              <span className="text-3xl font-mono text-white font-bold">
                {dbStats?.severity_distribution?.CRITICAL || alerts.filter(a => a.severity === "CRITICAL").length}
              </span>
            </div>
            <span className="text-[9px] text-neon-red font-mono font-semibold">ACTIVE TIMELINE</span>
          </div>

          {/* High Indicator */}
          <div className="cyber-card p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 bg-neon-orange" />
            <div>
              <span className="text-gray-500 text-[10px] tracking-wider font-cyber block mb-1">HIGH THREATS</span>
              <span className="text-3xl font-mono text-white font-bold">
                {dbStats?.severity_distribution?.HIGH || alerts.filter(a => a.severity === "HIGH").length}
              </span>
            </div>
            <span className="text-[9px] text-neon-orange font-mono font-semibold">IDS MONITORED</span>
          </div>

          {/* Medium Indicator */}
          <div className="cyber-card p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 bg-yellow-500" />
            <div>
              <span className="text-gray-500 text-[10px] tracking-wider font-cyber block mb-1">MEDIUM ALERTS</span>
              <span className="text-3xl font-mono text-white font-bold">
                {dbStats?.severity_distribution?.MEDIUM || alerts.filter(a => a.severity === "MEDIUM").length}
              </span>
            </div>
            <span className="text-[9px] text-yellow-500 font-mono font-semibold">INVESTIGATING</span>
          </div>

          {/* Low Indicator */}
          <div className="cyber-card p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 bg-neon-cyan" />
            <div>
              <span className="text-gray-500 text-[10px] tracking-wider font-cyber block mb-1">LOW ANOMALIES</span>
              <span className="text-3xl font-mono text-white font-bold">
                {dbStats?.severity_distribution?.LOW || alerts.filter(a => a.severity === "LOW").length}
              </span>
            </div>
            <span className="text-[9px] text-neon-cyan font-mono font-semibold">NO ACTION</span>
          </div>
        </div>

      </div>

      {/* Rules Engine and Alerts List Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* IDS Firewall Rules Controller */}
        <div className="cyber-card p-5 rounded-xl h-[420px] flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-cyber-border pb-3 shrink-0">
            <span className="font-cyber font-bold tracking-wider text-white text-sm">SIEM IDS SIG RULES</span>
            <span className="text-[10px] font-mono text-neon-cyan">ACTIVE</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1">
            {rules.map((rule) => {
              const isEnforced = rule.status === "ENFORCED";
              return (
                <div key={rule.id} className="p-3 bg-cyber-dark/40 border border-cyber-border rounded-lg flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-bold text-[11px]">{rule.name}</span>
                      <span className="text-[9px] text-gray-500">[{rule.severity}]</span>
                    </div>
                    <p className="text-gray-500 text-[10px] leading-normal">{rule.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`px-3 py-1.5 rounded font-cyber text-[9px] font-bold tracking-wider transition-all shadow shrink-0 ${
                      isEnforced 
                        ? "bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/30" 
                        : "bg-cyber-gray/40 border border-cyber-border text-gray-500 hover:text-gray-400"
                    }`}
                  >
                    {rule.status}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stateful SIEM Alerts Timeline Logger */}
        <div className="cyber-card p-5 rounded-xl lg:col-span-2 h-[420px] flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-cyber-border pb-3 shrink-0">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="text-neon-red h-4 w-4 animate-pulse" />
              <span className="font-cyber font-bold tracking-wider text-white text-sm">SECURITY ALERTS TIMELINE LOG</span>
            </div>
            {/* Filter buttons */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-cyber-dark border border-cyber-border rounded px-2.5 py-1 font-cyber text-[9px] font-bold tracking-wider text-white focus:outline-none focus:border-neon-cyan"
            >
              <option value="ALL">ALL SEVERITIES</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-xs pr-1">
            {filteredAlerts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-cyber">
                <CheckCircle className="text-neon-green h-8 w-8 mr-2 animate-pulse" />
                <span>NO CORRELATED SECURITY ALERTS IN TIMELINE GRID</span>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div 
                  key={alert.id || alert.timestamp}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 bg-cyber-dark/40 ${
                    alert.severity === "CRITICAL" ? "border-neon-red/30 bg-neon-red/5" :
                    alert.severity === "HIGH" ? "border-neon-orange/30 bg-neon-orange/5" : "border-cyber-border"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-widest border ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-gray-500">{new Date(alert.timestamp).toLocaleString()}</span>
                      <span className="text-neon-cyan font-bold text-[10px]">[{alert.category}]</span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-normal">{alert.message}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-gray-500 block text-[9px]">IP NODE</span>
                    <span className="text-white font-bold">{alert.src_ip}</span>
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
