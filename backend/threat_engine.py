from datetime import datetime, timedelta
import re
from collections import defaultdict, deque

class ThreatEngine:
    def __init__(self, alert_callback):
        self.alert_callback = alert_callback
        self.sensitivity = "medium"
        
        # IP sliding window history for stateful threat detection
        self.port_scan_history = defaultdict(lambda: deque(maxlen=100)) # IP -> list of (timestamp, port)
        self.packet_flood_history = defaultdict(lambda: deque(maxlen=500)) # IP -> list of timestamps
        self.ssh_brute_history = defaultdict(lambda: deque(maxlen=20)) # IP -> list of timestamps
        
        # Threat Threshold configuration (dynamic based on sensitivity)
        self._load_thresholds()

    def _load_thresholds(self):
        if self.sensitivity == "low":
            self.port_scan_count = 20     # Max unique ports in 10s
            self.flood_limit = 2000        # Max packets in 5s
            self.ssh_limit = 10           # Max failed SSH attempts
        elif self.sensitivity == "high":
            self.port_scan_count = 5      # Lower threshold for high sensitivity
            self.flood_limit = 500
            self.ssh_limit = 3
        else: # medium
            self.port_scan_count = 10
            self.flood_limit = 1000
            self.ssh_limit = 5

    def set_sensitivity(self, sensitivity):
        self.sensitivity = sensitivity
        self._load_thresholds()
        print(f"[ThreatEngine] Sensitivity changed to: {sensitivity}")

    def analyze_packet(self, packet_data, packet_id):
        """Analyze a real captured packet for threats."""
        src_ip = packet_data.get("src_ip")
        dst_ip = packet_data.get("dst_ip")
        protocol = packet_data.get("protocol")
        dst_port = packet_data.get("dst_port")
        payload = packet_data.get("payload", "")
        now = datetime.now()
        
        alerts_raised = []
        
        # Skip analyzing packets without valid IPs
        if not src_ip or src_ip == "0.0.0.0":
            return alerts_raised
            
        # 1. SQL Injection (SQLi) Payload Check
        if protocol in ("HTTP", "TCP") and payload:
            sqli_patterns = [
                r"(?i)UNION\s+SELECT",
                r"(?i)UNION\s+ALL\s+SELECT",
                r"(?i)SELECT\s+.*\s+FROM",
                r"(?i)OR\s+['\"].*['\"]?\s*=\s*['\"].*['\"]?",
                r"(?i)admin['\"].*--",
                r"(?i)DROP\s+TABLE",
                r"(?i)INSERT\s+INTO",
                r"(?i)DELETE\s+FROM",
                r"(?i)UPDATE\s+.*\s+SET",
                r"(?i)EXEC\s*\(",
                r"(?i)xp_cmdshell",
            ]
            for pattern in sqli_patterns:
                if re.search(pattern, payload):
                    alert = {
                        "timestamp": now.isoformat(),
                        "severity": "HIGH",
                        "category": "Injection Attack",
                        "src_ip": src_ip,
                        "dst_ip": dst_ip,
                        "message": f"Web Application Firewall: SQL Injection signature matched in payload: {pattern}",
                        "packet_id": packet_id,
                        "threat_score": 85
                    }
                    self.alert_callback(alert)
                    alerts_raised.append(alert)
                    packet_data["is_suspicious"] = 1
                    break

        # 2. XSS (Cross-Site Scripting) Detection
        if protocol in ("HTTP", "TCP") and payload:
            xss_patterns = [
                r"(?i)<script[\s>]",
                r"(?i)javascript\s*:",
                r"(?i)on(error|load|click|mouseover)\s*=",
                r"(?i)eval\s*\(",
                r"(?i)document\.(cookie|write|location)",
            ]
            for pattern in xss_patterns:
                if re.search(pattern, payload):
                    alert = {
                        "timestamp": now.isoformat(),
                        "severity": "HIGH",
                        "category": "XSS Attack",
                        "src_ip": src_ip,
                        "dst_ip": dst_ip,
                        "message": f"WAF Alert: Cross-Site Scripting (XSS) pattern detected: {pattern}",
                        "packet_id": packet_id,
                        "threat_score": 75
                    }
                    self.alert_callback(alert)
                    alerts_raised.append(alert)
                    packet_data["is_suspicious"] = 1
                    break
                    
        # 3. Port Scan Check (Stateful)
        if dst_port is not None:
            self.port_scan_history[src_ip].append((now, dst_port))
            # Filter history to keep only items in last 10 seconds
            cutoff = now - timedelta(seconds=10)
            while self.port_scan_history[src_ip] and self.port_scan_history[src_ip][0][0] < cutoff:
                self.port_scan_history[src_ip].popleft()
                
            unique_ports = set(port for _, port in self.port_scan_history[src_ip])
            if len(unique_ports) >= self.port_scan_count:
                # Clear active history to prevent duplicate alert storms
                self.port_scan_history[src_ip].clear()
                alert = {
                    "timestamp": now.isoformat(),
                    "severity": "MEDIUM",
                    "category": "Reconnaissance",
                    "src_ip": src_ip,
                    "dst_ip": dst_ip,
                    "message": f"Stateful Inspection: Port sweep scan detected from {src_ip}. Probed {len(unique_ports)} unique ports in 10s.",
                    "packet_id": packet_id,
                    "threat_score": 60
                }
                self.alert_callback(alert)
                alerts_raised.append(alert)
                packet_data["is_suspicious"] = 1

        # 4. DDoS SYN Flood / Packet Flooding Check (Stateful)
        self.packet_flood_history[src_ip].append(now)
        # Filter history to keep only items in last 5 seconds
        cutoff_flood = now - timedelta(seconds=5)
        while self.packet_flood_history[src_ip] and self.packet_flood_history[src_ip][0] < cutoff_flood:
            self.packet_flood_history[src_ip].popleft()
            
        if len(self.packet_flood_history[src_ip]) >= self.flood_limit:
            # Prevent immediate storming
            self.packet_flood_history[src_ip].clear()
            alert = {
                "timestamp": now.isoformat(),
                "severity": "CRITICAL",
                "category": "Denial of Service",
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "message": f"IDS Alert: High-volume traffic flood (DDoS) detected from source {src_ip} (>={self.flood_limit} packets in 5s). Host exhausted.",
                "packet_id": packet_id,
                "threat_score": 95
            }
            self.alert_callback(alert)
            alerts_raised.append(alert)
            packet_data["is_suspicious"] = 1

        # 5. SSH Brute Force Login Check
        if dst_port == 22 and payload and "Failed" in payload:
            self.ssh_brute_history[src_ip].append(now)
            cutoff_ssh = now - timedelta(seconds=20)
            while self.ssh_brute_history[src_ip] and self.ssh_brute_history[src_ip][0] < cutoff_ssh:
                self.ssh_brute_history[src_ip].popleft()
                
            if len(self.ssh_brute_history[src_ip]) >= self.ssh_limit:
                self.ssh_brute_history[src_ip].clear()
                alert = {
                    "timestamp": now.isoformat(),
                    "severity": "HIGH",
                    "category": "Credential Abuse",
                    "src_ip": src_ip,
                    "dst_ip": dst_ip,
                    "message": f"SIEM Correlator: Repetitive failed authentication attempts targeting port 22 (SSH Brute Force) from source {src_ip}.",
                    "packet_id": packet_id,
                    "threat_score": 80
                }
                self.alert_callback(alert)
                alerts_raised.append(alert)
                packet_data["is_suspicious"] = 1

        # 6. Suspicious Port Detection (common attack ports)
        suspicious_ports = {4444, 5555, 6666, 6667, 31337, 12345, 54321}
        if dst_port in suspicious_ports and not alerts_raised:
            alert = {
                "timestamp": now.isoformat(),
                "severity": "LOW",
                "category": "Suspicious Port",
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "message": f"Traffic detected on suspicious port {dst_port} commonly associated with malware or backdoors.",
                "packet_id": packet_id,
                "threat_score": 30
            }
            self.alert_callback(alert)
            alerts_raised.append(alert)
            packet_data["is_suspicious"] = 1

        return alerts_raised
