import React from "react";
import { 
  ShieldAlert, 
  Activity, 
  Terminal, 
  Map, 
  BarChart3, 
  History, 
  Settings, 
  Cpu, 
  KeyRound, 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, onLogout }) {
  const menuItems = [
    { id: "dashboard", label: "Realtime SOC", icon: Activity },
    { id: "monitor", label: "Packet Monitor", icon: Terminal },
    { id: "map", label: "Traffic Map", icon: Map },
    { id: "threats", label: "Threat Center", icon: ShieldAlert },
    { id: "analytics", label: "Traffic Analytics", icon: BarChart3 },
    { id: "history", label: "Historical Logs", icon: History },
    { id: "system", label: "System Status", icon: Cpu },
    { id: "settings", label: "Settings Panel", icon: Settings },
  ];

  return (
    <aside 
      className={`h-screen bg-cyber-dark/95 border-r border-cyber-border flex flex-col justify-between transition-all duration-300 z-20 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-cyber-border">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-6 w-6 text-neon-cyan animate-pulse" />
              <span className="font-cyber font-bold text-lg tracking-wider bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent glow-cyan">
                PHANTOMTRACE
              </span>
            </div>
          )}
          {collapsed && (
            <ShieldAlert className="h-6 w-6 text-neon-cyan mx-auto animate-pulse" />
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-cyber-gray rounded text-neon-cyan transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-4 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center p-3 rounded-lg text-sm font-cyber font-medium tracking-wide transition-all group ${
                  isActive 
                    ? "bg-neon-purple/20 text-neon-cyan border-l-4 border-neon-cyan shadow-md shadow-neon-purple/10" 
                    : "text-gray-400 hover:text-white hover:bg-cyber-gray/40 border-l-4 border-transparent"
                }`}
              >
                <Icon 
                  className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? "text-neon-cyan" : "text-gray-500 group-hover:text-neon-cyan"
                  } ${collapsed ? "mx-auto" : "mr-3"}`} 
                />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Session LogOut */}
      <div className="p-3 border-t border-cyber-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center p-3 rounded-lg text-sm font-cyber font-medium text-neon-red/70 hover:text-neon-red hover:bg-neon-red/10 transition-all group"
        >
          <LogOut className={`h-5 w-5 shrink-0 ${collapsed ? "mx-auto" : "mr-3"}`} />
          {!collapsed && <span>System Lock</span>}
        </button>
      </div>
    </aside>
  );
}
