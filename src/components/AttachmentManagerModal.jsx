import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { 
  X, Upload, FileText, Trash2, Download, Eye, 
  CheckCircle2, XCircle, MinusCircle, AlertCircle 
} from 'lucide-react';
import FullscreenViewerModal from './FullscreenViewerModal';

export default function AttachmentManagerModal({ 
  isOpen, 
  onClose, 
  employeeId, 
  category, 
  refId, 
  title, 
  currentStatus = 'missing',
  onStatusChange 
}) {
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // Fetch attachments for this specific item reactively from Dexie
  const attachments = useLiveQuery(
    () => db.attachments.where({ employeeId, category, refId }).toArray(),
    [employeeId, category, refId]
  ) || [];

  // Listen for Clipboard Paste (Ctrl+V screenshots) when modal is open
  React.useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (const item of clipboardItems) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const fileName = `لقطة_شاشة_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.png`;
            const reader = new FileReader();
            reader.onload = async () => {
              await db.attachments.add({
                employeeId,
                category,
                refId,
                fileName,
                fileType: 'image/png',
                fileSize: blob.size,
                fileData: reader.result,
                uploadDate: new Date().toISOString()
              });
              if (currentStatus === 'missing' && onStatusChange) {
                onStatusChange('attached');
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, employeeId, category, refId, currentStatus, onStatusChange]);

  if (!isOpen) return null;

  // Handle File Upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      // Read file data as Data URL
      const reader = new FileReader();
      reader.onload = async () => {
        const fileData = reader.result;
        await db.attachments.add({
          employeeId,
          category,
          refId,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileData,
          uploadDate: new Date().toISOString()
        });

        // Automatically change item status to 'attached' if it was 'missing'
        if (currentStatus === 'missing' && onStatusChange) {
          onStatusChange('attached');
        }
      };
      reader.readAsDataURL(file);
    }

    setFileInputKey(Date.now());
  };

  // Delete attachment
  const handleDeleteAttachment = async (id) => {
    await db.attachments.delete(id);
    if (previewAttachment?.id === id) setPreviewAttachment(null);

    // If no attachments remain and status was 'attached', reset to 'missing'
    if (attachments.length <= 1 && currentStatus === 'attached' && onStatusChange) {
      onStatusChange('missing');
    }
  };

  // Download attachment
  const handleDownload = (att) => {
    const a = document.createElement('a');
    a.href = att.fileData;
    a.download = att.fileName;
    a.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-900)' }}>
              إدارة المرفقات
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {title}
            </p>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Status Selection Buttons */}
        <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.85rem' }}>الحالة الحالية للبند:</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {currentStatus === 'na' ? (
                <span className="status-badge na"><MinusCircle size={14} /> تم التحديد يدوياً: لا يتطلب 🚫</span>
              ) : attachments.length > 0 ? (
                <span className="status-badge attached"><CheckCircle2 size={14} /> تحدث تلقائياً: تم الإرفاق ✅ ({attachments.length} ملف)</span>
              ) : (
                <span className="status-badge missing"><XCircle size={14} /> تحدث تلقائياً: غير مرفق ❌</span>
              )}
            </div>
          </div>

          <div>
            <button
              type="button"
              className={`btn btn-sm ${currentStatus === 'na' ? 'btn-secondary' : 'btn-outline'}`}
              style={currentStatus === 'na' ? { backgroundColor: '#475569', color: '#fff' } : { borderColor: '#cbd5e1' }}
              onClick={() => {
                if (onStatusChange) {
                  if (currentStatus === 'na') {
                    // Revert to auto status
                    onStatusChange(attachments.length > 0 ? 'attached' : 'missing');
                  } else {
                    // Manually set to 'na'
                    onStatusChange('na');
                  }
                }
              }}
              title="انقر لتعديل الخيار اليدوي (لا يتطلب)"
            >
              <MinusCircle size={15} />
              {currentStatus === 'na' ? 'إلغاء خيار (لا يتطلب)' : 'تحديد يدوياً كـ (لا يتطلب 🚫)'}
            </button>
          </div>
        </div>

        {/* File Upload Drop Area */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '1.5rem', 
              border: '2px dashed var(--primary-500)', 
              borderRadius: 'var(--radius-lg)', 
              backgroundColor: 'var(--primary-50)', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Upload size={32} color="var(--primary-600)" style={{ marginBottom: '0.5rem' }} />
            <span style={{ fontWeight: 700, color: 'var(--primary-700)', fontSize: '0.95rem' }}>
              اضغط لرفع ملف (صورة / PDF) أو الصق لقطة شاشة مباشرة (Ctrl + V)
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              📸 يمكنك أخذ سكرين شوت والضغط على Ctrl+V مباشرة للصقها هنا!
            </span>
            <input 
              key={fileInputKey}
              type="file" 
              accept="image/*,application/pdf"
              multiple 
              onChange={handleFileUpload}
              style={{ display: 'none' }} 
            />
          </label>
        </div>

        {/* Existing Attachments List */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} />
            المرفقات المرفوعة ({attachments.length}):
          </h4>

          {attachments.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed #cbd5e1' }}>
              <AlertCircle size={24} style={{ marginBottom: '0.35rem', opacity: 0.6 }} />
              <div>لا توجد مرفقات مرفوعة حالياً لـ هذا البند.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {attachments.map((att) => (
                <div 
                  key={att.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                    <FileText size={20} color="var(--primary-600)" style={{ flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {att.fileName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {(att.fileSize / 1024).toFixed(1)} KB | {new Date(att.uploadDate).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {/* View Preview Button */}
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPreviewAttachment(att)}
                      title="معاينة الملف"
                    >
                      <Eye size={15} />
                    </button>

                    {/* Download Button */}
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownload(att)}
                      title="تنزيل"
                    >
                      <Download size={15} />
                    </button>

                    {/* Delete Button */}
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteAttachment(att.id)}
                      title="حذف"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>
            تم / إغلاق
          </button>
        </div>

        {/* Fullscreen Preview Modal with Spotlight Highlight Frame Tool */}
        {previewAttachment && (
          <FullscreenViewerModal
            attachment={previewAttachment}
            onClose={() => setPreviewAttachment(null)}
          />
        )}
      </div>
    </div>
  );
}
