import asyncio
import os
import sys
import socket
import psutil
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Set
import uvicorn
import json

from db import (
    save_packet, 
    save_alert, 
    get_recent_packets, 
    get_recent_alerts, 
    get_db_stats, 
    get_settings, 
    update_setting,
    clear_database
)
from models import AuthRequest, AuthResponse, SettingsModel
from capture import CaptureEngine
from threat_engine import ThreatEngine

app = FastAPI(title="PhantomTrace API", version="2.0.0")

# Enable CORS for frontend Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection pool
connected_clients: Set[WebSocket] = set()

# Threat analyzer instance
threat_engine = None
# Capture engine instance
capture_engine = None

# Stats and telemetry
packet_counter = 0
last_packet_rate = 0.0
last_rate_time = datetime.now()

# Broadcast queue for websocket messages
broadcast_queue = asyncio.Queue()

# Store main event loop for thread-safe cross-thread calls
main_loop = None

def handle_incoming_packet(packet_data):
    global packet_counter
    packet_counter += 1
    
    # Save packet to SQLite database
    packet_id = save_packet(packet_data)
    packet_data["id"] = packet_id
    
    # Send to Threat Engine for processing
    alerts = threat_engine.analyze_packet(packet_data, packet_id)
    
    # If threat engine updated is_suspicious, re-save packet suspicious status
    if packet_data.get("is_suspicious") == 1:
        # Save alerts database entries
        for a in alerts:
            a["packet_id"] = packet_id
            save_alert(a)
            
    # Put onto the broadcast queue to stream to clients
    try:
        if main_loop:
            main_loop.call_soon_threadsafe(broadcast_queue.put_nowait, {
                "type": "packet",
                "data": packet_data,
                "alerts": alerts
            })
    except Exception as e:
        # Handle cases where loop isn't running yet or queue is full
        pass

def handle_incoming_alert(alert_data):
    # This is called directly when threat engine emits a standalone alert
    try:
        if main_loop:
            main_loop.call_soon_threadsafe(broadcast_queue.put_nowait, {
                "type": "alert",
                "data": alert_data
            })
    except Exception as e:
        pass

@app.on_event("startup")
async def startup_event():
    global threat_engine, capture_engine, main_loop
    
    main_loop = asyncio.get_event_loop()
    
    # Initialize engines
    threat_engine = ThreatEngine(alert_callback=handle_incoming_alert)
    capture_engine = CaptureEngine(
        packet_callback=handle_incoming_packet,
        alert_callback=handle_incoming_alert
    )
    
    # Load settings from db and apply to engines
    db_settings = get_settings()
    threat_engine.set_sensitivity(db_settings.get("ids_sensitivity", "medium"))
    
    # Start live capturing
    capture_engine.start()
    
    # Run the background broadcast loop
    asyncio.create_task(websocket_broadcaster())
    # Run server health telemetry loop
    asyncio.create_task(system_telemetry_broadcaster())

@app.on_event("shutdown")
async def shutdown_event():
    global capture_engine
    if capture_engine:
        capture_engine.stop()

async def websocket_broadcaster():
    while True:
        try:
            message = await broadcast_queue.get()
            if connected_clients:
                # Convert datetime objects if any to strings
                payload = json.dumps(message, default=str)
                inactive = []
                for client in connected_clients:
                    try:
                        await client.send_text(payload)
                    except Exception:
                        inactive.append(client)
                
                # Cleanup dead sockets
                for dead in inactive:
                    connected_clients.discard(dead)
            broadcast_queue.task_done()
        except Exception as e:
            await asyncio.sleep(0.1)

async def system_telemetry_broadcaster():
    global packet_counter, last_packet_rate, last_rate_time
    
    while True:
        await asyncio.sleep(2.0) # Send metrics updates every 2 seconds
        try:
            now = datetime.now()
            time_delta = (now - last_rate_time).total_seconds()
            
            if time_delta > 0:
                last_packet_rate = round(packet_counter / time_delta, 1)
            else:
                last_packet_rate = 0.0
                
            packet_counter = 0
            last_rate_time = now
            
            # Fetch computer performance telemetry
            cpu = psutil.cpu_percent(interval=None)
            ram = psutil.virtual_memory().percent
            disk_path = os.path.splitdrive(os.path.abspath(__file__))[0] or 'C:'
            disk = psutil.disk_usage(disk_path + os.sep).percent
            
            # Compute database file size
            db_size_kb = 0
            db_file = os.path.join(os.path.dirname(__file__), "phantomtrace.db")
            if os.path.exists(db_file):
                db_size_kb = round(os.path.getsize(db_file) / 1024, 1)
                
            db_stats = get_db_stats()
            
            # Form DEFCON threat level based on real alert data
            defcon = 5
            if db_stats["critical_alerts"] > 10:
                defcon = 1
            elif db_stats["critical_alerts"] > 5:
                defcon = 2
            elif db_stats["critical_alerts"] > 1:
                defcon = 3
            elif db_stats["total_alerts"] > 0:
                defcon = 4
            
            # Get real network info from capture engine
            network_info = capture_engine.get_network_info() if capture_engine else {}
                
            telemetry = {
                "cpu_usage": cpu,
                "ram_usage": ram,
                "packet_rate": last_packet_rate,
                "disk_free_percent": 100.0 - disk,
                "database_size_kb": db_size_kb,
                "defcon_level": defcon,
                "active_connections": len(connected_clients),
                "active_threats_count": db_stats["total_alerts"],
                "active_interface": network_info.get("interface_name", "Unknown"),
                "network_name": network_info.get("network_name", "Unknown"),
                "local_ip": network_info.get("local_ip", "0.0.0.0"),
                "capture_mode": network_info.get("capture_mode", "error")
            }
            
            if connected_clients:
                payload = json.dumps({
                    "type": "telemetry",
                    "data": telemetry,
                    "db_stats": db_stats
                })
                inactive = []
                for client in connected_clients:
                    try:
                        await client.send_text(payload)
                    except Exception:
                        inactive.append(client)
                for dead in inactive:
                    connected_clients.discard(dead)
                    
        except Exception as e:
            # Silence telemetry logs to prevent console cluttering
            pass

# --- API REST ENDPOINTS ---

@app.post("/api/auth/login", response_model=AuthResponse)
async def login(credentials: AuthRequest):
    if credentials.username == "admin" and credentials.password == "phantom1337":
        return AuthResponse(
            success=True, 
            token="jwt-phantomtrace-operator-token-x092b", 
            role="SecOps Administrator",
            message="Authorized access keys verified."
        )
    raise HTTPException(status_code=401, detail="Invalid credential token signatures.")

@app.get("/api/logs")
async def get_logs(limit: int = 100, protocol: str = None, search: str = None):
    try:
        packets = get_recent_packets(limit, protocol, search)
        return packets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/alerts")
async def get_alerts(limit: int = 100):
    try:
        alerts = get_recent_alerts(limit)
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resolve/{ip}")
async def resolve_ip(ip: str):
    def _resolve():
        try:
            name, _, _ = socket.gethostbyaddr(ip)
            return name
        except Exception:
            return ip
    
    hostname = await asyncio.to_thread(_resolve)
    return {"ip": ip, "hostname": hostname}

@app.get("/api/settings")
async def get_config():
    try:
        return get_settings()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/settings")
async def save_config(settings: SettingsModel):
    try:
        update_setting("ids_sensitivity", settings.ids_sensitivity)
        update_setting("max_log_limit", settings.max_log_limit)
        
        # Apply to engines dynamically
        threat_engine.set_sensitivity(settings.ids_sensitivity)
        
        return {"status": "success", "message": "Global system parameters synchronized."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/network-info")
async def get_network_info():
    """Return current network interface and WiFi details."""
    if capture_engine:
        return capture_engine.get_network_info()
    return {"interface_name": "Unknown", "network_name": "Unknown", "local_ip": "0.0.0.0", "capture_mode": "error"}

# --- WEBSOCKET ENDPOINT ---

@app.websocket("/ws/traffic")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    print(f"[WebSocket] Client connected. Total: {len(connected_clients)}")
    
    # Send historical logs and network info immediately
    try:
        packets = get_recent_packets(limit=50)
        alerts = get_recent_alerts(limit=15)
        db_stats = get_db_stats()
        network_info = capture_engine.get_network_info() if capture_engine else {}
        
        await websocket.send_text(json.dumps({
            "type": "init",
            "packets": packets,
            "alerts": alerts,
            "db_stats": db_stats,
            "active_interface": network_info.get("interface_name", "Unknown"),
            "network_name": network_info.get("network_name", "Unknown"),
            "local_ip": network_info.get("local_ip", "0.0.0.0"),
            "capture_mode": network_info.get("capture_mode", "error")
        }, default=str))
    except Exception as e:
        print(f"[WebSocket] Error during init handshake: {e}")
        
    try:
        while True:
            # Keep socket alive and receive any frontend controls/inputs if sent
            data = await websocket.receive_text()
            action = json.loads(data)
            if action.get("cmd") == "pause":
                capture_engine.stop()
            elif action.get("cmd") == "resume":
                capture_engine.start()
            elif action.get("cmd") == "sensitivity":
                sens = action.get("val", "medium")
                threat_engine.set_sensitivity(sens)
                update_setting("ids_sensitivity", sens)
            elif action.get("cmd") == "clear":
                clear_database()
                global packet_counter
                packet_counter = 0
    except WebSocketDisconnect:
        connected_clients.discard(websocket)
        print(f"[WebSocket] Client disconnected. Total: {len(connected_clients)}")
    except Exception as e:
        connected_clients.discard(websocket)
        print(f"[WebSocket] Exception: {e}")

# --- FRONTEND STATIC SERVING ---
# This must be at the very end of routes to prevent intercepting API routes
def get_frontend_dir():
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, "frontend", "dist")
    return os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

frontend_dist = get_frontend_dir()
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Ignore API or WS routes
    if full_path.startswith("api/") or full_path.startswith("ws/"):
        raise HTTPException(status_code=404, detail="Not found")

    file_path = os.path.join(frontend_dist, full_path)
    if full_path and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "PhantomTrace API Running (Frontend build not found)"}

if __name__ == "__main__":
    print("[Server] Starting PhantomTrace Fast-Stream Server...")
    # Pass the app object directly instead of a string to fix PyInstaller ASGI import errors
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
