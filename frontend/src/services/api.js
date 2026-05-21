const API_BASE = window.location.port === "5173" ? "http://localhost:8000/api" : "/api";
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const WS_BASE = window.location.port === "5173" ? "ws://localhost:8000/ws" : `${protocol}//${window.location.host}/ws`;

class ApiService {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.connected = false;
    this.reconnectTimer = null;
  }

  // REST API Methods
  async getLogs(limit = 100, protocol = null, search = null) {
    let url = `${API_BASE}/logs?limit=${limit}`;
    if (protocol) url += `&protocol=${protocol}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");
    return await res.json();
  }

  async getAlerts(limit = 50) {
    const res = await fetch(`${API_BASE}/alerts?limit=${limit}`);
    if (!res.ok) throw new Error("API error");
    return await res.json();
  }

  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error("API error");
    return await res.json();
  }

  async saveSettings(settings) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    return await res.json();
  }

  async login(username, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) return { success: false, message: "Invalid credentials." };
      return await res.json();
    } catch (e) {
      return { success: false, message: "Backend server is not reachable. Start the backend first." };
    }
  }

  async getNetworkInfo() {
    try {
      const res = await fetch(`${API_BASE}/network-info`);
      if (!res.ok) throw new Error("API error");
      return await res.json();
    } catch (e) {
      return { interface_name: "Unknown", network_name: "Unknown", local_ip: "0.0.0.0", capture_mode: "error" };
    }
  }

  // WEBSOCKET MANAGEMENT
  connectWebSocket(onMessage) {
    this.listeners.add(onMessage);

    // Don't create a new connection if one already exists
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(`${WS_BASE}/traffic`);

      this.ws.onopen = () => {
        console.log("[WS] Connected to PhantomTrace Backend — LIVE MODE.");
        this.connected = true;
        // Notify listeners of connection status
        this.listeners.forEach(listener => listener({
          type: "connection_status",
          connected: true
        }));
      };

      this.ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        this.listeners.forEach(listener => listener(payload));
      };

      this.ws.onerror = (err) => {
        console.warn("[WS] Connection error.", err);
        this.connected = false;
        this.listeners.forEach(listener => listener({
          type: "connection_status",
          connected: false,
          error: "WebSocket connection failed. Is the backend running as Administrator?"
        }));
      };

      this.ws.onclose = () => {
        console.log("[WS] Connection closed.");
        this.connected = false;
        this.listeners.forEach(listener => listener({
          type: "connection_status",
          connected: false
        }));
        // Auto-reconnect after 3 seconds
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          console.log("[WS] Attempting reconnection...");
          this.connectWebSocket(onMessage);
        }, 3000);
      };
    } catch (e) {
      console.error("[WS] Failed to create WebSocket connection.", e);
      this.connected = false;
      this.listeners.forEach(listener => listener({
        type: "connection_status",
        connected: false,
        error: "Cannot connect to backend. Ensure the server is running."
      }));
    }
  }

  disconnectWebSocket(onMessage) {
    this.listeners.delete(onMessage);
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.listeners.size === 0 && this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendControlCommand(cmd, val = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ cmd, val }));
    }
  }
}

export default new ApiService();
