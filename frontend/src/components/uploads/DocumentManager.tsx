import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, X, AlertTriangle, CheckCircle, Lock, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  authToken: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const DocumentManager: React.FC<Props> = ({ isOpen, onClose, authToken }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch user documents:', err);
    }
  };

  useEffect(() => {
    if (isOpen && authToken) {
      fetchDocuments();
    }
  }, [isOpen, authToken]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authToken) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      const data = await res.json();
      setSuccess(`Indexed "${file.name}" (${data.chunks_indexed} chunks) into your private vault.`);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        setDocuments(documents.filter(d => d.id !== docId));
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#07130E] border border-emerald-500/25 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-[0_20px_80px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-500/15">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-[#A9EE70]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Private Document Vault</h3>
              <p className="text-xs text-slate-400 font-mono">
                Isolated Tenant Ingestion with Dense + Sparse Hybrid Indexing
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Tenant boundary guarantees banner */}
          <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-2xl p-4 text-xs text-slate-300 space-y-1.5">
            <div className="font-mono font-bold text-[#A9EE70] uppercase tracking-wider flex items-center gap-1.5">
              <span>Tenant Boundary Guarantees</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Private uploads are indexed into Qdrant Cloud filtered strictly by your verified JWT subject UUID. Other tenants can never access or retrieve your private records.
            </p>
            <div className="font-mono text-[11px] text-emerald-400 pt-1">
              Limits: Max 25MB • Max 100 pages • Max 10 documents per user
            </div>
          </div>

          {!authToken ? (
            <div className="p-6 border border-dashed border-amber-500/30 rounded-2xl bg-amber-950/20 text-center space-y-2">
              <ShieldAlert className="w-6 h-6 text-amber-400 mx-auto" />
              <div className="text-xs font-mono font-bold text-amber-300">
                Tenant Persona Required for Private Vault
              </div>
              <p className="text-xs text-slate-400">
                You are currently in Public Anonymous mode. To test private document isolation, switch to <strong>User A</strong> or <strong>User B</strong> in the left sidebar switcher.
              </p>
            </div>
          ) : (
            <>
              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-emerald-500/25 rounded-2xl p-6 text-center hover:border-[#A9EE70]/60 hover:bg-[#0B1A14]/40 transition-all duration-300 group">
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="file-vault-upload"
                />
                <label
                  htmlFor="file-vault-upload"
                  className={`cursor-pointer flex flex-col items-center gap-2.5 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-[#A9EE70] group-hover:scale-110 group-hover:bg-[#A9EE70]/15 transition-all">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-white group-hover:text-[#A9EE70] transition">
                    {uploading ? 'Parsing & Indexing into Qdrant Cloud...' : 'Upload Environmental Report (PDF, TXT, MD)'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Click to browse local files
                  </span>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 text-xs bg-rose-950/60 text-rose-300 border border-rose-500/30 rounded-xl font-mono">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 text-xs bg-emerald-950/60 text-[#A9EE70] border border-emerald-500/30 rounded-xl font-mono">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-[#A9EE70]" />
                  <span>{success}</span>
                </div>
              )}

              {/* Document List */}
              <div className="space-y-2.5 pt-2">
                <div className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center justify-between">
                  <span>Your Vault Documents ({documents.length} / 10)</span>
                  <span className="text-[10px] text-emerald-400">Active Tenant</span>
                </div>

                {documents.length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center border border-dashed border-emerald-500/15 rounded-xl">
                    No private documents uploaded for this tenant yet.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3.5 bg-[#0B1A14] border border-emerald-500/15 rounded-xl hover:border-emerald-500/30 transition">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-[#A9EE70]">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate">{doc.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {doc.page_count} pages • {doc.chunk_count} chunks • Ready
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                        title="Delete document synchronously from Qdrant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
