from pydantic import BaseModel
from typing import List, Dict, Any

class PacketModel(BaseModel):
    id: int = 0
    timestamp: str = ""
    protocol: str = ""
    src_ip: str = ""
    dst_ip: str = ""
    src_port: int = 0
    dst_port: int = 0
    length: int = 0
    summary: str = ""
    payload: str = ""
    layers: List[str] = []
    is_suspicious: int = 0

class AlertModel(BaseModel):
    id: int = 0
    timestamp: str = ""
    severity: str = ""
    category: str = ""
    src_ip: str = ""
    dst_ip: str = ""
    message: str = ""
    packet_id: int = 0
    threat_score: int = 0

class SettingsModel(BaseModel):
    ids_sensitivity: str = "medium"
    max_log_limit: int = 1000

class SystemStatsModel(BaseModel):
    cpu_usage: float = 0.0
    ram_usage: float = 0.0
    packet_rate: float = 0.0
    disk_free_percent: float = 0.0
    database_size_kb: float = 0.0
    defcon_level: int = 5
    active_connections: int = 0
    active_threats_count: int = 0

class AuthRequest(BaseModel):
    username: str = ""
    password: str = ""

class AuthResponse(BaseModel):
    success: bool = False
    token: str = ""
    role: str = ""
    message: str = ""
