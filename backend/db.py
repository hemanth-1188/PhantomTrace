import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "phantomtrace.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Packets Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS packets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            protocol TEXT NOT NULL,
            src_ip TEXT NOT NULL,
            dst_ip TEXT NOT NULL,
            src_port INTEGER,
            dst_port INTEGER,
            length INTEGER NOT NULL,
            summary TEXT,
            payload TEXT,
            layers TEXT,
            is_suspicious INTEGER DEFAULT 0
        )
    """)
    
    # Threats / Alerts Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            severity TEXT NOT NULL,
            category TEXT NOT NULL,
            src_ip TEXT NOT NULL,
            dst_ip TEXT NOT NULL,
            message TEXT NOT NULL,
            packet_id INTEGER,
            threat_score INTEGER DEFAULT 0,
            FOREIGN KEY(packet_id) REFERENCES packets(id)
        )
    """)
    
    # Settings Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)
    
    # Seed default settings if not exists
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('ids_sensitivity', 'medium')")
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('simulation_speed', '1.0')")
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('max_log_limit', '10000')")
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('capture_mode', 'hybrid')")
    
    conn.commit()
    conn.close()

def save_packet(packet_data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO packets (timestamp, protocol, src_ip, dst_ip, src_port, dst_port, length, summary, payload, layers, is_suspicious)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        packet_data.get("timestamp", datetime.now().isoformat()),
        packet_data.get("protocol", "UNKNOWN"),
        packet_data.get("src_ip", "0.0.0.0"),
        packet_data.get("dst_ip", "0.0.0.0"),
        packet_data.get("src_port"),
        packet_data.get("dst_port"),
        packet_data.get("length", 0),
        packet_data.get("summary", ""),
        packet_data.get("payload", ""),
        json.dumps(packet_data.get("layers", [])),
        1 if packet_data.get("is_suspicious") else 0
    ))
    packet_id = cursor.lastrowid
    
    # Enforce maximum 5000 packets cleanup rule
    cursor.execute("SELECT COUNT(*) FROM packets")
    total = cursor.fetchone()[0]
    if total > 5000:
        cursor.execute("DELETE FROM packets")
        cursor.execute("DELETE FROM alerts")
        # Optional: reset autoincrement but sqlite does it automatically or we can just keep going.
        
    conn.commit()
    conn.close()
    return packet_id

def clear_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM packets")
    cursor.execute("DELETE FROM alerts")
    conn.commit()
    conn.close()

def save_alert(alert_data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO alerts (timestamp, severity, category, src_ip, dst_ip, message, packet_id, threat_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        alert_data.get("timestamp", datetime.now().isoformat()),
        alert_data.get("severity", "INFO"),
        alert_data.get("category", "Anomaly"),
        alert_data.get("src_ip", "0.0.0.0"),
        alert_data.get("dst_ip", "0.0.0.0"),
        alert_data.get("message", ""),
        alert_data.get("packet_id"),
        alert_data.get("threat_score", 0)
    ))
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return alert_id

def get_recent_packets(limit=100, protocol=None, search=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM packets"
    params = []
    
    conditions = []
    if protocol:
        conditions.append("protocol = ?")
        params.append(protocol)
    if search:
        conditions.append("(src_ip LIKE ? OR dst_ip LIKE ? OR summary LIKE ?)")
        search_param = f"%{search}%"
        params.extend([search_param, search_param, search_param])
        
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
        
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    packets = []
    for r in rows:
        p = dict(r)
        p["layers"] = json.loads(p["layers"])
        packets.append(p)
    return packets

def get_recent_alerts(limit=100):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_db_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM packets")
    total_packets = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM alerts")
    total_alerts = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE severity = 'CRITICAL' AND severity != 'HIGH'")
    critical_alerts = cursor.fetchone()[0]
    
    cursor.execute("SELECT protocol, COUNT(*) as cnt FROM packets GROUP BY protocol")
    proto_dist = {row["protocol"]: row["cnt"] for row in cursor.fetchall()}
    
    cursor.execute("SELECT severity, COUNT(*) as cnt FROM alerts GROUP BY severity")
    severity_dist = {row["severity"]: row["cnt"] for row in cursor.fetchall()}
    
    conn.close()
    return {
        "total_packets": total_packets,
        "total_alerts": total_alerts,
        "critical_alerts": critical_alerts,
        "protocol_distribution": proto_dist,
        "severity_distribution": severity_dist
    }

def update_setting(key, value):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(value)))
    conn.commit()
    conn.close()

def get_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM settings")
    rows = cursor.fetchall()
    conn.close()
    return {row["key"]: row["value"] for row in rows}

# Initialize database tables on load
init_db()
