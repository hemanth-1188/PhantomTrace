import React, { useState, useEffect, useMemo, useRef } from "react";
import { Network, Server, Shield, Globe, Terminal, ShieldAlert, Monitor } from "lucide-react";

export default function TrafficMap({ packets, networkInfo }) {
  const [particles, setParticles] = useState([]);
  const [hostnames, setHostnames] = useState({});

  // Dynamically build node topology from real captured IPs
  const { nodes, links, ipToNode } = useMemo(() => {
    const localIp = networkInfo?.local_ip || "127.0.0.1";
    const nodeMap = {};
    const ipNodeMap = {};
    const linkSet = new Set();
    const linkArr = [];

    // Center node = this machine
    nodeMap["local"] = {
      x: 500, y: 300,
      label: "This Machine",
      ip: localIp,
      icon: Monitor,
      color: "#00ff66",
      isLocal: true
    };
    ipNodeMap[localIp] = "local";
    ipNodeMap["127.0.0.1"] = "local";

    // Gather unique external IPs from packets
    const externalIps = new Set();
    const recentPackets = packets.slice(-100); // Use last 100 packets for topology
    
    recentPackets.forEach(p => {
      if (p.src_ip && p.src_ip !== localIp && p.src_ip !== "127.0.0.1") {
        externalIps.add(p.src_ip);
      }
      if (p.dst_ip && p.dst_ip !== localIp && p.dst_ip !== "127.0.0.1") {
        externalIps.add(p.dst_ip);
      }
    });

    // Fetch missing hostnames asynchronously
    externalIps.forEach(ip => {
      if (!hostnames[ip] && hostnames[ip] !== null) {
        // Mark as null to prevent multiple requests while fetching
        setHostnames(prev => ({ ...prev, [ip]: null }));
        const apiBase = window.location.port === "5173" ? "http://localhost:8000/api" : "/api";
        fetch(`${apiBase}/resolve/${ip}`)
          .then(res => res.json())
          .then(data => {
            if (data.hostname && data.hostname !== ip) {
              setHostnames(prev => ({ ...prev, [ip]: data.hostname }));
            } else {
              setHostnames(prev => ({ ...prev, [ip]: ip })); // Keep IP if no hostname
            }
          })
          .catch(() => setHostnames(prev => ({ ...prev, [ip]: ip })));
      }
    });

    // Arrange external IPs in a circle around the center
    const ipArray = Array.from(externalIps).slice(0, 10); // Max 10 nodes for clarity
    const radius = 220;
    const centerX = 500;
    const centerY = 300;

    ipArray.forEach((ip, idx) => {
      const angle = (2 * Math.PI * idx) / Math.max(ipArray.length, 1) - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      // Determine if this IP is suspicious
      const isSuspicious = recentPackets.some(p => 
        (p.src_ip === ip || p.dst_ip === ip) && p.is_suspicious === 1
      );

      // Determine dominant protocol for this IP
      const protocols = {};
      recentPackets.forEach(p => {
        if (p.src_ip === ip || p.dst_ip === ip) {
          protocols[p.protocol] = (protocols[p.protocol] || 0) + 1;
        }
      });
      const dominantProto = Object.keys(protocols).sort((a, b) => protocols[b] - protocols[a])[0] || "TCP";

      const nodeId = `node_${idx}`;
      // Truncate long hostnames for better UI fit
      let displayLabel = hostnames[ip] || ip;
      if (displayLabel.length > 26) {
        displayLabel = displayLabel.substring(0, 24) + "...";
      }

      nodeMap[nodeId] = {
        x: Math.round(x),
        y: Math.round(y),
        label: displayLabel,
        ip: ip,
        icon: isSuspicious ? ShieldAlert : (dominantProto === "DNS" ? Globe : Server),
        color: isSuspicious ? "#ff0055" : getProtoColorStatic(dominantProto),
        isSuspicious
      };
      ipNodeMap[ip] = nodeId;
    });

    // Build true links based on actual packet communication
    recentPackets.forEach(p => {
      const fromId = ipNodeMap[p.src_ip];
      const toId = ipNodeMap[p.dst_ip];
      if (fromId && toId && fromId !== toId) {
        // Normalize link key so A-B and B-A draw only one line
        const linkKey = fromId < toId ? `${fromId}-${toId}` : `${toId}-${fromId}`;
        const isSuspicious = p.is_suspicious === 1;
        
        if (!linkSet.has(linkKey)) {
          linkSet.add(linkKey);
          linkArr.push({ from: fromId, to: toId, isSuspicious });
        } else if (isSuspicious) {
          // If already drawn but a new packet is suspicious, mark the link suspicious
          const existingLink = linkArr.find(l => (l.from === fromId && l.to === toId) || (l.from === toId && l.to === fromId));
          if (existingLink) existingLink.isSuspicious = true;
        }
      }
    });

    return { nodes: nodeMap, links: linkArr, ipToNode: ipNodeMap };
  }, [packets.length, networkInfo?.local_ip, hostnames]);

  function getProtoColorStatic(proto) {
    switch (proto) {
      case "TCP": return "#00f0ff";
      case "UDP": return "#bd00ff";
      case "ICMP": return "#00ff66";
      case "DNS": return "#ff9900";
      case "HTTP": return "#eab308";
      case "HTTPS": return "#6366f1";
      case "SSH": return "#ff0055";
      default: return "#9ca3af";
    }
  }

  const getProtoColor = (proto) => getProtoColorStatic(proto);

  const lastPacketTimeRef = useRef(null);

  // Whenever new packets arrive, spawn flying particles on the SVG
  useEffect(() => {
    if (packets.length === 0) return;
    
    // Find newly arrived packets
    const newPackets = [];
    for (let i = packets.length - 1; i >= 0; i--) {
      if (packets[i].timestamp === lastPacketTimeRef.current) break;
      newPackets.unshift(packets[i]);
    }

    // Limit the burst of particles but allow a much larger threshold to show "every packet"
    const packetsToSpawn = newPackets.length > 80 ? newPackets.slice(-80) : newPackets;

    if (packetsToSpawn.length > 0) {
      lastPacketTimeRef.current = packetsToSpawn[packetsToSpawn.length - 1].timestamp;
      
      const newParticles = [];
      packetsToSpawn.forEach(pkt => {
        const fromNodeId = ipToNode[pkt.src_ip];
        const toNodeId = ipToNode[pkt.dst_ip];
        if (fromNodeId && toNodeId && nodes[fromNodeId] && nodes[toNodeId]) {
          newParticles.push({
            id: Math.random() + "-" + pkt.timestamp,
            from: nodes[fromNodeId],
            to: nodes[toNodeId],
            color: getProtoColor(pkt.protocol),
            protocol: pkt.protocol,
            isSuspicious: pkt.is_suspicious === 1
          });
        }
      });

      if (newParticles.length > 0) {
        setParticles(prev => [...prev.slice(-100), ...newParticles].slice(-180)); // Allow up to 180 concurrent particles
        
        // Prune particles after transition concludes (faster 800ms)
        setTimeout(() => {
          setParticles(prev => {
            const newIds = new Set(newParticles.map(p => p.id));
            return prev.filter(p => !newIds.has(p.id));
          });
        }, 800);
      }
    }

  }, [packets, ipToNode, nodes]);

  return (
    <div className="p-6 space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      
      {/* Top Banner */}
      <div className="cyber-card p-4 rounded-xl flex items-center justify-between shrink-0">
        <div>
          <span className="font-cyber font-bold tracking-wider text-white text-sm">LIVE NETWORK TOPOLOGY</span>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
            Real-time traffic flow between your machine and external hosts. Nodes built from captured packets.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="flex items-center text-neon-cyan"><span className="w-2 h-2 rounded-full bg-neon-cyan mr-1.5 animate-ping" /> TCP</span>
          <span className="flex items-center text-neon-purple"><span className="w-2 h-2 rounded-full bg-neon-purple mr-1.5 animate-ping" /> UDP</span>
          <span className="flex items-center text-neon-green"><span className="w-2 h-2 rounded-full bg-neon-green mr-1.5 animate-ping" /> ICMP</span>
          <span className="flex items-center text-neon-red"><span className="w-2 h-2 rounded-full bg-neon-red mr-1.5 animate-ping" /> Threat</span>
          <span className="flex items-center text-[#6366f1]"><span className="w-2 h-2 rounded-full bg-[#6366f1] mr-1.5 animate-ping" /> HTTPS</span>
        </div>
      </div>

      {/* Interactive Map Visualizer */}
      <div className="cyber-card rounded-xl flex-1 relative overflow-hidden bg-cyber-dark/60 select-none">
        
        {/* Animated matrix dots grid backdrop */}
        <div className="absolute inset-0 cyber-grid-dense opacity-30 pointer-events-none" />

        {Object.keys(nodes).length <= 1 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-cyber text-sm">
            <div className="text-center">
              <Network className="mx-auto h-12 w-12 text-neon-cyan/30 mb-3 animate-pulse" />
              <p>Waiting for live traffic to build topology...</p>
              <p className="text-[10px] text-gray-600 mt-1">Nodes will appear as packets are captured</p>
            </div>
          </div>
        ) : (
          <svg className="w-full h-full min-h-[500px]" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
            
            {/* Neon Glow filters */}
            <defs>
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Links Connectors */}
            {links.map((link, idx) => {
              const from = nodes[link.from];
              const to = nodes[link.to];
              if (!from || !to) return null;
              return (
                <g key={idx}>
                  <line
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke="rgba(0, 240, 255, 0.05)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <line
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke={link.isSuspicious ? "rgba(255,0,85,0.15)" : "rgba(46, 48, 58, 0.4)"}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {/* Flying Data Particles */}
            {particles.map((p) => (
              <circle
                key={p.id}
                r={p.isSuspicious ? "5" : "4"}
                fill={p.color}
                style={{
                  filter: "url(#glow-cyan)",
                  animation: "fly-particle 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
                }}
              >
                <animate attributeName="cx" from={p.from.x} to={p.to.x} dur="0.8s" repeatCount="1" fill="freeze" />
                <animate attributeName="cy" from={p.from.y} to={p.to.y} dur="0.8s" repeatCount="1" fill="freeze" />
              </circle>
            ))}

            {/* Nodes Draw */}
            {Object.entries(nodes).map(([key, node]) => {
              const Icon = node.icon;
              const isDanger = node.isSuspicious;
              const isLocal = node.isLocal;
              return (
                <g key={key} className="cursor-pointer group">
                  {/* Node Outer Halo Glow */}
                  <circle
                    cx={node.x} cy={node.y}
                    r={isLocal ? "40" : "32"}
                    fill="rgba(13, 14, 20, 0.9)"
                    stroke={isDanger ? "rgba(255,0,85,0.3)" : isLocal ? "rgba(0, 255, 102, 0.3)" : "rgba(0, 240, 255, 0.15)"}
                    strokeWidth={isLocal ? "2.5" : "1.5"}
                    className="group-hover:stroke-neon-purple transition-all duration-300"
                  />
                  {/* Interactive Ring */}
                  <circle
                    cx={node.x} cy={node.y}
                    r={isLocal ? "32" : "24"}
                    fill="#06060a"
                    stroke={isDanger ? "#ff0055" : node.color}
                    strokeWidth={isLocal ? "2.5" : "2"}
                  />
                  {/* Centered Icon */}
                  <g transform={`translate(${node.x - (isLocal ? 12 : 10)}, ${node.y - (isLocal ? 12 : 10)})`} className="pointer-events-none">
                    <Icon size={isLocal ? 24 : 20} style={{ color: isDanger ? "#ff0055" : node.color }} />
                  </g>

                  {/* Label */}
                  <text
                    x={node.x} y={node.y - (isLocal ? 48 : 40)}
                    textAnchor="middle"
                    fill={isLocal ? "#00ff66" : "#ffffff"}
                    fontSize={isLocal ? "14" : "12"}
                    fontFamily="Space Grotesk, sans-serif"
                    fontWeight="bold"
                  >
                    {node.label}
                  </text>
                  {isLocal && (
                    <text
                      x={node.x} y={node.y + 54}
                      textAnchor="middle"
                      fill="#6b7280"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {networkInfo?.network_name || "Local"}
                    </text>
                  )}
                </g>
              );
            })}

          </svg>
        )}

        {/* Dynamic Flying CSS styling */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fly-particle {
            0% { opacity: 0; transform: scale(0.5); }
            10% { opacity: 1; transform: scale(1.1); }
            90% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0; transform: scale(0.3); }
          }
        `}} />

      </div>

    </div>
  );
}
