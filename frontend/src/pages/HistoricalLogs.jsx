import React, { useState, useEffect } from "react";
import { Search, Filter, Download, ArrowLeft, ArrowRight, ShieldAlert, Loader2 } from "lucide-react";
import api from "../services/api";

export default function HistoricalLogs({ setSelectedPacket }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [protocol, setProtocol] = useState("");
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Fetch historical logs from DB endpoint
      const res = await api.getLogs(100, protocol || null, search || null);
      setLogs(res || []);
    } catch (e) {
      console.error("Could not fetch historical logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [protocol, limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  // Pagination bounds compute
  const totalItems = logs.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedLogs = logs.slice((page - 1) * limit, page * limit);

  // CSV Exporter
  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = ["ID", "Timestamp", "Protocol", "Source IP", "Destination IP", "Length", "Summary", "Suspicious"];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      l.protocol,
      l.src_ip,
      l.dst_ip,
      l.length,
      `"${l.summary.replace(/"/g, '""')}"`,
      l.is_suspicious
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `phantomtrace_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Exporter
  const exportToJSON = () => {
    if (logs.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `phantomtrace_security_bundle_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      
      {/* Search Filter and Exporters toolbar */}
      <div className="cyber-card p-4 rounded-xl shrink-0">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Query Inputs */}
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Query database (Press Enter)..."
                className="w-full bg-cyber-dark border border-cyber-border rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
              />
            </div>
            
            <div className="relative shrink-0 w-full sm:w-44">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan appearance-none font-cyber font-bold tracking-wider"
              >
                <option value="">ALL PROTOCOLS</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
                <option value="DNS">DNS</option>
                <option value="HTTP">HTTP</option>
                <option value="SSH">SSH</option>
              </select>
            </div>
          </div>

          {/* Exporters dropdown buttons */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={exportToCSV}
              disabled={logs.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-cyber-gray hover:bg-neon-cyan/20 border border-cyber-border hover:border-neon-cyan text-white hover:text-neon-cyan font-cyber font-bold text-xs tracking-wider rounded-lg disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-95"
            >
              <Download size={14} />
              <span>EXPORT CSV</span>
            </button>
            <button
              type="button"
              onClick={exportToJSON}
              disabled={logs.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-cyber-gray hover:bg-neon-purple/20 border border-cyber-border hover:border-neon-purple text-white hover:text-neon-purple font-cyber font-bold text-xs tracking-wider rounded-lg disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-95"
            >
              <Download size={14} />
              <span>EXPORT JSON</span>
            </button>
          </div>

        </form>
      </div>

      {/* Grid Table */}
      <div className="cyber-card rounded-xl flex-1 overflow-hidden flex flex-col bg-cyber-dark/40">
        
        {/* Table Head */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-cyber-gray border-b border-cyber-border font-cyber text-[10px] font-bold tracking-widest text-gray-500 uppercase shrink-0">
          <div className="col-span-1">ID</div>
          <div className="col-span-3">TIMESTAMP RECORD</div>
          <div className="col-span-1">PROTO</div>
          <div className="col-span-2">SOURCE</div>
          <div className="col-span-2">DESTINATION</div>
          <div className="col-span-3">SUMMARY</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto font-mono text-xs divide-y divide-cyber-border/40 select-none">
          {loading ? (
            <div className="h-full flex items-center justify-center text-neon-cyan">
              <Loader2 className="animate-spin h-8 w-8 mr-2" />
              <span>QUERYING DATABASE REGISTRY...</span>
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <span>NO HISTORICAL CAPTURES LOADED</span>
            </div>
          ) : (
            paginatedLogs.map((pkt) => (
              <div
                key={pkt.id || pkt.timestamp}
                onClick={() => setSelectedPacket(pkt)}
                className={`grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-cyber-gray/30 border-l-2 cursor-pointer transition-all ${
                  pkt.is_suspicious === 1 ? "border-l-neon-red bg-neon-red/5" : "border-l-transparent"
                }`}
              >
                <div className="col-span-1 text-gray-600">#{pkt.id}</div>
                <div className="col-span-3 text-gray-500 truncate">{new Date(pkt.timestamp).toLocaleString()}</div>
                <div className="col-span-1">
                  <span className="px-2 py-0.5 border border-cyber-border bg-cyber-gray text-gray-300 rounded text-[9px] font-bold">
                    {pkt.protocol}
                  </span>
                </div>
                <div className="col-span-2 text-neon-cyan font-bold truncate">{pkt.src_ip}</div>
                <div className="col-span-2 text-neon-purple font-bold truncate">{pkt.dst_ip}</div>
                
                {/* Info & action */}
                <div className="col-span-3 flex items-center justify-between overflow-hidden">
                  <span className="text-white truncate flex-1 mr-2">{pkt.summary}</span>
                  {pkt.is_suspicious === 1 && (
                    <ShieldAlert size={14} className="text-neon-red animate-pulse shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination controls footer */}
        <div className="p-4 bg-cyber-gray border-t border-cyber-border flex items-center justify-between font-cyber text-xs shrink-0 select-none">
          <div className="text-gray-500">
            Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span> | Total <span className="text-white font-bold">{totalItems}</span> entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-cyber-border rounded hover:border-neon-cyan hover:bg-neon-cyan/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 border border-cyber-border rounded hover:border-neon-cyan hover:bg-neon-cyan/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
