import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PacketInspectorModal from "./components/PacketInspectorModal";

import LandingPage from "./pages/LandingPage";
import AuthScreen from "./pages/AuthScreen";
import Dashboard from "./pages/Dashboard";
import PacketMonitor from "./pages/PacketMonitor";
import TrafficMap from "./pages/TrafficMap";
import ThreatCenter from "./pages/ThreatCenter";
import AnalyticsPage from "./pages/AnalyticsPage";
import HistoricalLogs from "./pages/HistoricalLogs";
import SystemStatus from "./pages/SystemStatus";
import SettingsPanel from "./pages/SettingsPanel";

import api from "./services/api";

export default function App() {
  // Session Access Router States
  const [step, setStep] = useState("landing"); // "landing" | "auth" | "console"
  const [operator, setOperator] = useState(null);
  
  // Realtime Telemetry and Stream Buffers
  const [packets, setPackets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  
  // Network info from backend
  const [networkInfo, setNetworkInfo] = useState({
    interface_name: "Detecting...",
    network_name: "Detecting...",
    local_ip: "0.0.0.0",
    capture_mode: "live",
    connected: false
  });
  
  // Interface Layout Settings
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // Batch processing buffers
  const packetBuffer = useRef([]);
  const alertBuffer = useRef([]);

  // Periodic flusher to prevent React re-render lockups under heavy traffic
  useEffect(() => {
    const flushInterval = setInterval(() => {
      if (packetBuffer.current.length > 0 && !isPaused) {
        setPackets(prev => {
          const next = [...prev, ...packetBuffer.current];
          packetBuffer.current = [];
          return next.length > 100 ? next.slice(next.length - 100) : next;
        });
      }
      if (alertBuffer.current.length > 0) {
        setAlerts(prev => {
          const next = [...alertBuffer.current, ...prev];
          alertBuffer.current = [];
          return next.slice(0, 100);
        });
      }
    }, 300); // 300ms batching for responsive real-time feel
    return () => clearInterval(flushInterval);
  }, [isPaused]);

  // Hook into WebSocket Real-time Stream
  useEffect(() => {
    if (step !== "console") return;

    const handleStreamMessage = (payload) => {
      if (payload.type === "init") {
        setPackets(payload.packets || []);
        setAlerts(payload.alerts || []);
        setDbStats(payload.db_stats || null);
        setNetworkInfo(prev => ({
          ...prev,
          interface_name: payload.active_interface || "Unknown",
          network_name: payload.network_name || "Unknown",
          local_ip: payload.local_ip || "0.0.0.0",
          capture_mode: payload.capture_mode || "live",
          connected: true
        }));
      } 
      else if (payload.type === "packet") {
        if (!isPaused) {
          packetBuffer.current.push(payload.data);
        }
        if (payload.alerts && payload.alerts.length > 0) {
          alertBuffer.current.push(...payload.alerts);
        }
      } 
      else if (payload.type === "telemetry") {
        setTelemetry(payload.data || null);
        if (payload.db_stats) setDbStats(payload.db_stats);
        // Update network info from telemetry
        if (payload.data) {
          setNetworkInfo(prev => ({
            ...prev,
            interface_name: payload.data.active_interface || prev.interface_name,
            network_name: payload.data.network_name || prev.network_name,
            local_ip: payload.data.local_ip || prev.local_ip,
            capture_mode: payload.data.capture_mode || prev.capture_mode,
            connected: true
          }));
        }
      }
      else if (payload.type === "connection_status") {
        setNetworkInfo(prev => ({
          ...prev,
          connected: payload.connected
        }));
      }
    };

    api.connectWebSocket(handleStreamMessage);

    return () => {
      api.disconnectWebSocket(handleStreamMessage);
    };
  }, [step, isPaused]);

  // Authorization Locks
  const handleAuthSuccess = (res) => {
    setOperator(res);
    setStep("console");
  };

  const handleLogout = () => {
    setOperator(null);
    setStep("landing");
    setPackets([]);
    setAlerts([]);
    setTelemetry(null);
  };

  // Sniffer Buffers controls
  const handleClearBuffers = () => {
    setPackets([]);
    setAlerts([]);
    api.sendControlCommand("clear");
  };

  const handlePauseSniffer = () => {
    setIsPaused(true);
    api.sendControlCommand("pause");
  };

  const handleResumeSniffer = () => {
    setIsPaused(false);
    api.sendControlCommand("resume");
  };

  // Tweak live configuration changes
  const handleConfigChanged = (sensitivity) => {
    api.sendControlCommand("sensitivity", sensitivity);
  };

  // Render tab based switches
  const renderConsoleTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard 
            packets={packets} 
            alerts={alerts} 
            telemetry={telemetry} 
            dbStats={dbStats} 
            setActiveTab={setActiveTab}
            setSelectedPacket={setSelectedPacket}
          />
        );
      case "monitor":
        return (
          <PacketMonitor 
            packets={packets} 
            onClear={handleClearBuffers}
            onPause={handlePauseSniffer}
            onResume={handleResumeSniffer}
            isPaused={isPaused}
            setSelectedPacket={setSelectedPacket}
          />
        );
      case "map":
        return <TrafficMap packets={packets} networkInfo={networkInfo} />;
      case "threats":
        return <ThreatCenter alerts={alerts} dbStats={dbStats} />;
      case "analytics":
        return <AnalyticsPage packets={packets} dbStats={dbStats} />;
      case "history":
        return <HistoricalLogs setSelectedPacket={setSelectedPacket} />;
      case "system":
        return <SystemStatus telemetry={telemetry} networkInfo={networkInfo} />;
      case "settings":
        return <SettingsPanel onConfigChanged={handleConfigChanged} />;
      default:
        return <Dashboard packets={packets} alerts={alerts} telemetry={telemetry} dbStats={dbStats} />;
    }
  };

  // Gateway route checks
  if (step === "landing") {
    return <LandingPage onEnter={() => setStep("auth")} />;
  }

  if (step === "auth") {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cyber-black text-gray-200">
      {/* Collapsible Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed}
        onLogout={handleLogout}
      />

      {/* Main Panel Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Status bar */}
        <Header telemetry={telemetry} networkInfo={networkInfo} onClear={handleClearBuffers} />

        {/* Console viewports */}
        <main className="flex-1 overflow-hidden bg-cyber-dark/40 relative">
          <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
          {renderConsoleTab()}
        </main>
      </div>

      {/* Deep Packet Inspector Modal */}
      {selectedPacket && (
        <PacketInspectorModal 
          packet={selectedPacket} 
          onClose={() => setSelectedPacket(null)} 
        />
      )}
    </div>
  );
}
