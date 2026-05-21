import React, { useState } from "react";
import { X, BookOpen, Layers, Binary, ShieldAlert } from "lucide-react";

export default function PacketInspectorModal({ packet, onClose }) {
  const [activeSubTab, setActiveSubTab] = useState("layers"); // "layers", "hex", "education"

  if (!packet) return null;

  // Educational database explaining protocols, cybersecurity threats, and communication mechanics
  const getProtocolEducation = (proto) => {
    const database = {
      TCP: {
        title: "Transmission Control Protocol (TCP)",
        desc: "A connection-oriented, highly reliable transport protocol. It operates on Layer 4 of the OSI model and establishes a virtual connection between endpoints before transmitting any data.",
        mechanics: "Utilizes a 'Three-Way Handshake' (SYN, SYN-ACK, ACK) to synchronize sequence numbers and verify port listening states, enabling flow control and error recovery.",
        security: "Vulnerable to 'SYN Flooding' DDoS attacks, where an attacker sends massive volumes of SYN requests without replying to SYN-ACKs, overloading connection buffers and knocking servers offline."
      },
      UDP: {
        title: "User Datagram Protocol (UDP)",
        desc: "A lightweight, connectionless, and high-velocity transport protocol operating at Layer 4. It does not perform handshake validations, error correction, or congestion recovery.",
        mechanics: "Fires data packets directly at a target port without checking if the recipient is listening or ready. Frequently used for realtime gaming, VoIP, and DNS queries where speed takes precedence.",
        security: "Highly susceptible to 'UDP Spoofing' and 'UDP Amplification' reflection attacks, since there is no source verification handshake."
      },
      DNS: {
        title: "Domain Name System (DNS)",
        desc: "The directory system of the Internet that translates human-readable domain names (e.g., google.com) into numerical IP addresses. Operating on Layer 7 over UDP Port 53.",
        mechanics: "Clients send a fast UDP query requesting record entries (like A, AAAA, MX). Resolvers check caches or crawl DNS roots recursively to return IP solutions.",
        security: "Can be hijacked via 'DNS Cache Poisoning' or spoofing, directing traffic to hacker-owned replica pages. Also abused in 'DNS Tunneling' to bypass firewalls and sneak out compromised data."
      },
      HTTP: {
        title: "Hypertext Transfer Protocol (HTTP)",
        desc: "An application-layer protocol (Layer 7) that forms the foundation of data communication on the World Wide Web. Historically sent in clean unencrypted plain text.",
        mechanics: "Uses standard text commands (GET to fetch files, POST to submit login credentials, PUT, DELETE) and yields numeric status answers (e.g., 200 OK, 404 Not Found, 500 Server Error).",
        security: "Because it lacks encryption, any attacker on a local network can capture plain-text payloads (credit cards, passwords) using standard sniffing. Vulnerable to SQLi and XSS injection vectors."
      },
      ICMP: {
        title: "Internet Control Message Protocol (ICMP)",
        desc: "A core diagnostic and error-reporting protocol on Layer 3. It carries control metrics rather than user application payloads.",
        mechanics: "Network utilities like 'ping' and 'traceroute' fire ICMP Echo Request (Type 8) packages to hosts, expecting a reciprocal Echo Reply (Type 0) to compute hop-by-hop latency.",
        security: "Attackers can abuse ICMP to perform 'Ping of Death' buffer overflow attacks or trigger 'Smurf attacks' to overwhelm network nodes."
      },
      SSH: {
        title: "Secure Shell (SSH)",
        desc: "A secure cryptographic protocol operating on TCP Port 22. It enables secure remote terminal control and command executions over unsecured network lanes.",
        mechanics: "Establishes a highly secure encrypted tunnel using public-key cryptography to perform handshake keys validation and encrypt all following command traffic.",
        security: "Threat actors heavily target exposed Port 22 SSH entryports using dictionary attacks or brute-force scripts to guess credentials and compromise servers."
      }
    };

    return database[proto] || {
      title: `${proto} Protocol Signature`,
      desc: `An operating network protocol detected on Layer ${packet.layers.length + 2} of the OSI communication grid.`,
      mechanics: `Processes networking traffic from source node ${packet.src_ip} targeting recipient node ${packet.dst_ip}.`,
      security: "Ensure IDS signatures are regularly updated to isolate unauthorized payloads or malformed packets."
    };
  };

  const edu = getProtocolEducation(packet.protocol);

  // Hex dump generator
  const generateHexDump = (str) => {
    const lines = [];
    const payloadBytes = str ? Array.from(new TextEncoder().encode(str)) : [];
    
    // Seed at least 64 bytes of mock hexadecimal data if payload is small/empty
    while (payloadBytes.length < 64) {
      payloadBytes.push(Math.floor(Math.random() * 256));
    }

    for (let i = 0; i < payloadBytes.length && i < 128; i += 16) {
      const chunk = payloadBytes.slice(i, i + 16);
      const hex = chunk.map(b => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
      const ascii = chunk.map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : ".").join("");
      
      const offset = i.toString(16).padStart(4, "0").toUpperCase();
      lines.push(`${offset}  ${hex.padEnd(47, " ")}  |${ascii}|`);
    }
    return lines.join("\n");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-black/70 backdrop-blur-sm p-4">
      <div className="cyber-card w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl overflow-hidden border-glow-cyan">
        
        {/* Modal Header */}
        <div className="p-4 bg-cyber-gray border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Layers className="text-neon-cyan h-5 w-5 animate-pulse" />
            <span className="font-cyber font-bold tracking-wider text-white">
              PHANTOMTRACE // DEEP PACKET INSPECTION
            </span>
            {packet.is_suspicious === 1 && (
              <span className="flex items-center text-xs font-cyber bg-neon-red/10 border border-neon-red/30 px-2 py-0.5 rounded text-neon-red font-semibold animate-pulse">
                <ShieldAlert size={12} className="mr-1" /> SUSPICIOUS
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-cyber-dark rounded text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Grid */}
        <div className="p-4 bg-cyber-dark/40 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-cyber-border text-sm font-mono">
          <div>
            <span className="text-gray-500 block text-xs">SOURCE ENDPOINT</span>
            <span className="text-neon-cyan font-bold">{packet.src_ip}{packet.src_port ? `:${packet.src_port}` : ""}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs">DESTINATION ENDPOINT</span>
            <span className="text-neon-purple font-bold">{packet.dst_ip}{packet.dst_port ? `:${packet.dst_port}` : ""}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs">PROTOCOL INTERRUPT</span>
            <span className="text-neon-green font-bold glow-green">{packet.protocol}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs">LENGTH BYTES</span>
            <span className="text-white font-bold">{packet.length} bytes</span>
          </div>
        </div>

        {/* Tabs Control */}
        <div className="flex bg-cyber-dark border-b border-cyber-border">
          <button
            onClick={() => setActiveSubTab("layers")}
            className={`px-6 py-3 font-cyber text-xs font-bold tracking-wider border-b-2 transition-all flex items-center ${
              activeSubTab === "layers"
                ? "border-neon-cyan text-neon-cyan bg-cyber-gray/20"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <Layers size={14} className="mr-2" /> OSI LAYERS BREAKDOWN
          </button>
          <button
            onClick={() => setActiveSubTab("hex")}
            className={`px-6 py-3 font-cyber text-xs font-bold tracking-wider border-b-2 transition-all flex items-center ${
              activeSubTab === "hex"
                ? "border-neon-purple text-neon-purple bg-cyber-gray/20"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <Binary size={14} className="mr-2" /> HEXADECIMAL DUMP
          </button>
          <button
            onClick={() => setActiveSubTab("education")}
            className={`px-6 py-3 font-cyber text-xs font-bold tracking-wider border-b-2 transition-all flex items-center ${
              activeSubTab === "education"
                ? "border-neon-green text-neon-green bg-cyber-gray/20"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <BookOpen size={14} className="mr-2" /> EDUCATIONAL SYNOPSIS
          </button>
        </div>

        {/* Tab Content Viewport */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[50vh] bg-cyber-black text-gray-300">
          {activeSubTab === "layers" && (
            <div className="space-y-4">
              {/* Frame Layer */}
              <div className="p-3 bg-cyber-gray/30 border border-cyber-border rounded-lg">
                <span className="text-neon-cyan font-bold text-xs block font-cyber tracking-widest">LAYER 1: PHYSICAL FRAME</span>
                <p className="font-mono text-sm mt-1 text-gray-400">
                  Frame #{packet.id}: {packet.length} bytes captured on active network interface. Timestamp: {new Date(packet.timestamp).toLocaleString()}
                </p>
              </div>
              {/* Ethernet Layer */}
              <div className="p-3 bg-cyber-gray/30 border border-cyber-border rounded-lg">
                <span className="text-neon-purple font-bold text-xs block font-cyber tracking-widest">LAYER 2: DATA LINK (ETHERNET)</span>
                <p className="font-mono text-sm mt-1 text-gray-400">
                  Destination MAC: 00:1A:2B:3C:4D:5E &larr; Source MAC: 00:5E:4D:3C:2B:1A | Type: IPv4 (0x0800)
                </p>
              </div>
              {/* Network Layer */}
              <div className="p-3 bg-cyber-gray/30 border border-cyber-border rounded-lg">
                <span className="text-neon-green font-bold text-xs block font-cyber tracking-widest">LAYER 3: NETWORK (IP)</span>
                <p className="font-mono text-sm mt-1 text-gray-400">
                  Internet Protocol Version 4, Src: {packet.src_ip}, Dst: {packet.dst_ip} | Header Length: 20 bytes | TTL: 64
                </p>
              </div>
              {/* Transport Layer */}
              {packet.protocol !== "ICMP" && (
                <div className="p-3 bg-cyber-gray/30 border border-cyber-border rounded-lg">
                  <span className="text-neon-orange font-bold text-xs block font-cyber tracking-widest">LAYER 4: TRANSPORT ({packet.protocol})</span>
                  <p className="font-mono text-sm mt-1 text-gray-400">
                    Source Port: {packet.src_port} &rarr; Destination Port: {packet.dst_port} | Sequence Number: {Math.floor(Math.random()*100000)} | Flags: [ACK]
                  </p>
                </div>
              )}
              {/* Payload Layer */}
              {packet.payload && (
                <div className="p-3 bg-cyber-gray/30 border border-cyber-border rounded-lg">
                  <span className="text-neon-red font-bold text-xs block font-cyber tracking-widest">APPLICATION LAYER PAYLOAD DATA</span>
                  <pre className="font-mono text-xs mt-2 p-2 bg-cyber-black border border-cyber-border/40 rounded overflow-x-auto text-neon-cyan">
                    {packet.payload}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeSubTab === "hex" && (
            <div>
              <pre className="font-mono text-xs p-4 bg-cyber-dark/40 border border-cyber-border rounded overflow-x-auto text-neon-cyan glow-cyan leading-relaxed select-text crt-overlay">
                {generateHexDump(packet.payload)}
              </pre>
            </div>
          )}

          {activeSubTab === "education" && (
            <div className="space-y-4">
              <h3 className="font-cyber font-bold text-xl text-white tracking-wide border-b border-cyber-border pb-2 flex items-center">
                <BookOpen size={20} className="text-neon-green mr-2" /> {edu.title}
              </h3>
              <div>
                <span className="text-neon-cyan font-bold text-xs block font-cyber tracking-widest">PROTOCOL OVERVIEW</span>
                <p className="mt-1 text-sm text-gray-400 font-sans leading-relaxed">{edu.desc}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="p-4 bg-cyber-gray/25 border border-cyber-border rounded-lg">
                  <span className="text-neon-purple font-bold text-xs block font-cyber tracking-widest">OPERATIONAL MECHANICS</span>
                  <p className="mt-1 text-xs text-gray-400 font-sans leading-relaxed">{edu.mechanics}</p>
                </div>
                <div className="p-4 bg-neon-red/5 border border-neon-red/15 rounded-lg">
                  <span className="text-neon-red font-bold text-xs block font-cyber tracking-widest">CYBERSECURITY VULNERABILITIES</span>
                  <p className="mt-1 text-xs text-gray-400 font-sans leading-relaxed">{edu.security}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-cyber-gray border-t border-cyber-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg font-cyber font-bold text-xs tracking-wider bg-cyber-dark hover:bg-neon-cyan/20 border border-cyber-border hover:border-neon-cyan text-white hover:text-neon-cyan transition-all"
          >
            DISMISS REPORT
          </button>
        </div>
      </div>
    </div>
  );
}
