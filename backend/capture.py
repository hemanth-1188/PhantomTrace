import threading
import time
import socket
import subprocess
import psutil
from datetime import datetime
import traceback

# Try importing scapy
try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP, Raw, DNS, DNSQR, conf
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

class CaptureEngine:
    def __init__(self, packet_callback, alert_callback):
        self.packet_callback = packet_callback
        self.alert_callback = alert_callback
        self.running = False
        self.thread = None
        self.mode = "live"
        self.active_interface = "Unknown"
        self.network_name = "Unknown"
        self.local_ip = "0.0.0.0"
        self._detect_interface()
        self._check_privileges()

    def _detect_interface(self):
        """Detect the active WiFi interface, its SSID, and local IP address."""
        try:
            if SCAPY_AVAILABLE:
                iface = conf.iface
                self.active_interface = getattr(iface, 'name', getattr(iface, 'description', str(iface)))
        except Exception:
            self.active_interface = "Unknown"

        # Get WiFi SSID via netsh on Windows
        try:
            result = subprocess.run(
                ['netsh', 'wlan', 'show', 'interfaces'],
                capture_output=True, text=True, timeout=5
            )
            for line in result.stdout.split('\n'):
                if 'SSID' in line and 'BSSID' not in line:
                    self.network_name = line.split(':', 1)[1].strip()
                    break
        except Exception:
            self.network_name = "Unknown Network"

        # Get local IP address for the WiFi interface
        try:
            addrs = psutil.net_if_addrs()
            # Try Wi-Fi first, then fallback to any interface with an IPv4 address
            wifi_addrs = addrs.get('Wi-Fi', addrs.get('WiFi', []))
            for addr in wifi_addrs:
                if addr.family.name == 'AF_INET':
                    self.local_ip = addr.address
                    break
            
            # Fallback: use socket to find default outbound IP
            if self.local_ip == "0.0.0.0":
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                self.local_ip = s.getsockname()[0]
                s.close()
        except Exception:
            self.local_ip = "127.0.0.1"

        print(f"[CaptureEngine] Interface: {self.active_interface}")
        print(f"[CaptureEngine] WiFi Network: {self.network_name}")
        print(f"[CaptureEngine] Local IP: {self.local_ip}")

    def _check_privileges(self):
        """Check if Scapy is available to capture."""
        if not SCAPY_AVAILABLE:
            self.mode = "error"
            print("[CaptureEngine] ERROR: Scapy is not installed. Cannot capture packets.")
            print("[CaptureEngine] Install with: pip install scapy")
            return

        self.mode = "live"
        print("[CaptureEngine] Scapy available. Live capture mode ready.")

    def start(self):
        if self.running:
            return
        
        if self.mode == "error":
            print("[CaptureEngine] Cannot start: missing privileges or dependencies.")
            print("[CaptureEngine] Ensure Npcap is installed and run as Administrator.")
            # Still set running so the app doesn't crash, but no packets will be captured
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._run_live_capture, daemon=True)
        self.thread.start()
        print(f"[CaptureEngine] LIVE capture started on {self.active_interface} ({self.network_name})")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
        print("[CaptureEngine] Capture engine stopped.")

    def _process_scapy_packet(self, packet):
        """Process a single packet captured by Scapy and send it to the callback."""
        try:
            if IP not in packet:
                return

            ip_layer = packet[IP]
            src_ip = ip_layer.src
            dst_ip = ip_layer.dst
            length = len(packet)
            timestamp = datetime.now().isoformat()

            protocol = "IP"
            src_port = None
            dst_port = None
            payload = ""
            layers = ["Ethernet", "IP"]

            if TCP in packet:
                tcp_layer = packet[TCP]
                src_port = tcp_layer.sport
                dst_port = tcp_layer.dport
                layers.append("TCP")

                # Check for HTTPS (TLS on port 443)
                if dst_port == 443 or src_port == 443:
                    protocol = "HTTPS"
                    layers.append("TLS")
                    # Try to extract SNI from Client Hello
                    if packet.haslayer(Raw):
                        raw_data = packet[Raw].load
                        sni = self._extract_tls_sni(raw_data)
                        if sni:
                            payload = f"TLS Client Hello: SNI={sni}"
                        else:
                            payload = "TLS Encrypted Application Data"
                    else:
                        payload = "TLS Encrypted Session"
                # Check for HTTP payload
                elif packet.haslayer(Raw):
                    raw_data = packet[Raw].load.decode(errors='ignore')
                    payload = raw_data[:500]
                    if any(cmd in raw_data for cmd in ["GET ", "POST ", "HTTP/1.", "PUT ", "DELETE "]):
                        protocol = "HTTP"
                        layers.append("HTTP")
                    else:
                        protocol = "TCP"
                else:
                    protocol = "TCP"

            elif UDP in packet:
                udp_layer = packet[UDP]
                src_port = udp_layer.sport
                dst_port = udp_layer.dport
                layers.append("UDP")

                if packet.haslayer(DNS):
                    protocol = "DNS"
                    layers.append("DNS")
                    dns_layer = packet[DNS]
                    if dns_layer.qr == 0 and dns_layer.haslayer(DNSQR):
                        payload = f"DNS Query: {dns_layer[DNSQR].qname.decode(errors='ignore')}"
                    elif dns_layer.qr == 1:
                        payload = "DNS Response"
                else:
                    protocol = "UDP"

            elif ICMP in packet:
                protocol = "ICMP"
                layers.append("ICMP")
                icmp_layer = packet[ICMP]
                icmp_type = icmp_layer.type
                if icmp_type == 8:
                    payload = "ICMP Echo Request (Ping)"
                elif icmp_type == 0:
                    payload = "ICMP Echo Reply (Pong)"
                else:
                    payload = f"ICMP Type {icmp_type}"

            src_port_str = f":{src_port}" if src_port else ""
            dst_port_str = f":{dst_port}" if dst_port else ""
            summary = f"{protocol} {src_ip}{src_port_str} → {dst_ip}{dst_port_str} [{length} bytes]"

            packet_data = {
                "timestamp": timestamp,
                "protocol": protocol,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_port": src_port,
                "dst_port": dst_port,
                "length": length,
                "summary": summary,
                "payload": payload,
                "layers": layers,
                "is_suspicious": 0,
                "capture_type": "LIVE"
            }

            self.packet_callback(packet_data)

        except Exception as e:
            # Silence packet parsing errors to prevent crashing background threads
            pass

    def _extract_tls_sni(self, raw_bytes):
        """Try to extract Server Name Indication (SNI) from a TLS Client Hello."""
        try:
            # TLS Client Hello starts with content type 0x16 (Handshake)
            if len(raw_bytes) < 6 or raw_bytes[0] != 0x16:
                return None
            # Handshake type 0x01 = Client Hello
            if raw_bytes[5] != 0x01:
                return None
            
            # Search for SNI extension (type 0x0000)
            # Simple scan approach
            data = raw_bytes
            i = 0
            while i < len(data) - 5:
                if data[i] == 0x00 and data[i+1] == 0x00:
                    # Potential SNI extension
                    if i + 4 < len(data):
                        ext_len = int.from_bytes(data[i+2:i+4], 'big')
                        if ext_len > 0 and i + 4 + ext_len <= len(data):
                            sni_data = data[i+4:i+4+ext_len]
                            # SNI list: skip first 2 bytes (list length), 
                            # then 1 byte (type), 2 bytes (name length), then the name
                            if len(sni_data) > 5:
                                name_len = int.from_bytes(sni_data[3:5], 'big')
                                if name_len > 0 and 5 + name_len <= len(sni_data):
                                    hostname = sni_data[5:5+name_len].decode('ascii', errors='ignore')
                                    if '.' in hostname and len(hostname) > 3:
                                        return hostname
                i += 1
            return None
        except Exception:
            return None

    def _run_live_capture(self):
        """Run live packet capture using Scapy's sniff()."""
        try:
            print(f"[CaptureEngine] Starting Scapy sniff on {self.active_interface}...")
            sniff(
                prn=self._process_scapy_packet,
                store=0,
                stop_filter=lambda x: not self.running
            )
        except Exception as e:
            print(f"[CaptureEngine] Live capture error: {e}")
            traceback.print_exc()
            self.mode = "error"

    def get_network_info(self):
        """Return current network information for the frontend."""
        return {
            "interface_name": self.active_interface,
            "network_name": self.network_name,
            "local_ip": self.local_ip,
            "capture_mode": self.mode
        }
