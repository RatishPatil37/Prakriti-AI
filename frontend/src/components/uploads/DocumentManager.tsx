import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, X, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  authToken: string | null;
}

export const DocumentManager: React.FC<Props> = ({ isOpen, onClose, authToken }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/v1/documents', {
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
      const res = await fetch('/api/v1/documents', {
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
      const res = await fetch(`/api/v1/documents/${docId}`, {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-evergreen-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-earth-border rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-earth-border">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-forest-600" />
            <h3 className="text-base font-serif font-semibold text-evergreen">Private Document Vault</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-earth-100 rounded-lg text-evergreen/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quotas info */}
          <div className="bg-botanical-100 border border-earth-border rounded-xl p-3 text-xs text-evergreen/75 space-y-1">
            <div className="font-semibold text-evergreen">Tenant Boundary Guarantees:</div>
            <p>Documents uploaded here are indexed into Qdrant Cloud with strict verified user UUID isolation. User B queries can never retrieve User A's private records.</p>
            <div className="font-mono text-[11px] text-evergreen/60 pt-1">
              Limits: Max 25MB • Max 100 pages • Max 10 documents per user
            </div>
          </div>

          {/* Upload input */}
          <div className="border-2 border-dashed border-earth-border rounded-xl p-6 text-center hover:border-forest-600/50 transition">
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileUpload}
              disabled={uploading || !authToken}
              className="hidden"
              id="file-vault-upload"
            />
            <label
              htmlFor="file-vault-upload"
              className={`cursor-pointer flex flex-col items-center gap-2 ${uploading || !authToken ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="w-6 h-6 text-forest-600" />
              <span className="text-sm font-medium text-evergreen">
                {uploading ? 'Parsing & Indexing into Qdrant...' : 'Upload Environmental Report (PDF, TXT, MD)'}
              </span>
              <span className="text-xs text-evergreen/50">
                Click to browse private document
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Document list */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-evergreen/60">
              Your Uploaded Documents ({documents.length} / 10)
            </div>

            {documents.length === 0 ? (
              <div className="text-xs text-evergreen/50 py-4 text-center">
                No private documents uploaded yet.
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-botanical-50 border border-earth-border rounded-xl">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-medium text-evergreen truncate">{doc.title}</div>
                      <div className="text-[10px] text-evergreen/50 font-mono">
                        {doc.page_count} pages • {doc.chunk_count} chunks • Ready
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 hover:bg-rose-50 text-evergreen/50 hover:text-rose-600 rounded-lg transition"
                    title="Delete document synchronously from Qdrant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
