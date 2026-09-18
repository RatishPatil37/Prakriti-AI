import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, X, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

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
      console.error('Failed to fetch documents:', err);
    }
  };

  useEffect(() => {
    if (isOpen && authToken) fetchDocuments();
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
      setSuccess(`"${file.name}" uploaded and indexed (${data.chunks_indexed} sections).`);
      fetchDocuments();
      // Clear file input
      e.target.value = '';
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
              <Lock className="w-4 h-4 text-[var(--color-accent-light)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-sans">My Documents</h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Private — only visible to you
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-surface-2)] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {!authToken ? (
            <div className="py-10 text-center space-y-2">
              <Lock className="w-8 h-8 text-[var(--color-text-muted)] mx-auto" />
              <p className="text-sm text-[var(--color-text-secondary)]">Sign in to upload and manage documents.</p>
            </div>
          ) : (
            <>
              {/* Privacy note */}
              <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-3.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Your documents are private and encrypted. They are only used to answer your questions and cannot be accessed by other users.
                <span className="block mt-1 text-[var(--color-text-muted)]">Limits: PDF, TXT, or MD · Max 25 MB · Max 100 pages · Up to 10 documents</span>
              </div>

              {/* Upload dropzone */}
              <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-6 text-center hover:border-[var(--color-accent)] transition-colors group">
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="doc-upload-input"
                />
                <label
                  htmlFor="doc-upload-input"
                  className={`cursor-pointer flex flex-col items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-accent)] transition">
                    <Upload className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-light)] transition" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {uploading ? 'Processing…' : 'Upload a document'}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Click to browse or drag and drop
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 text-xs bg-rose-950/40 text-rose-400 border border-rose-500/20 rounded-xl">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 text-xs bg-[var(--color-accent-subtle)] text-[var(--color-accent-light)] border border-[rgba(78,136,98,0.25)] rounded-xl">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {success}
                </div>
              )}

              {/* Document list */}
              <div>
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                  Your documents ({documents.length} / 10)
                </p>
                {documents.length === 0 ? (
                  <div className="text-xs text-[var(--color-text-muted)] py-6 text-center border border-dashed border-[var(--color-border)] rounded-xl">
                    No documents uploaded yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-border-hover)] transition">
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-[var(--color-accent-light)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{doc.title}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)]">
                            {doc.page_count} pages · {doc.chunk_count} sections
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-[var(--color-text-muted)] hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition flex-shrink-0"
                          title="Remove document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
