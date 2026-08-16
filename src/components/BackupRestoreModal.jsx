import React, { useState } from 'react';
import { exportDatabaseBackup, importDatabaseBackup } from '../db/database';
import { X, Download, Upload, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function BackupRestoreModal({ isOpen, onClose }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportDatabaseBackup();
      setMessage({ type: 'success', text: 'تم تصدير النسخة الاحتياطية بنجاح إلى ملف JSON كلي!' });
    } catch (err) {
      setMessage({ type: 'error', text: `حدث خطأ أثناء التصدير: ${err.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('WARNING ⚠️: استعادة نسخة احتياطية ستقوم باستبدال كافة البيانات الحالية بالبيانات الموجودة بالملف. هل ترغب في الاستمرار؟')) {
      return;
    }

    try {
      setIsImporting(true);
      const text = await file.text();
      await importDatabaseBackup(text);
      setMessage({ type: 'success', text: 'تمت استعادة قاعدة البيانات والمرفقات بنجاح! سيتم تحديث الصفحة...' });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setMessage({ type: 'error', text: `فشلت استعادة البيانات: ${err.message}` });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-900)' }}>
            <Database color="var(--primary-600)" />
            مركز الحفظ والاستعادة (Backup & Restore)
          </h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {message && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            background: message.type === 'success' ? 'var(--accent-emerald-light)' : 'var(--accent-rose-light)',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
          }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Export Box */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', background: '#f8fafc', textAlign: 'center' }}>
            <Download size={36} color="var(--primary-600)" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>تصدير نسخة احتياطية</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              قم بتنزيل ملف شمول يحتوي على كافة الموظفين، الرواتب، العقود، والمرفقات (PDFs وصور) للفظ بأمان على جهازك.
            </p>
            <button className="btn btn-primary" onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'جاري التصدير...' : 'تنزيل ملف النسخة الاحتياطية (.json)'}
            </button>
          </div>

          {/* Restore Box */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', background: '#f8fafc', textAlign: 'center' }}>
            <Upload size={36} color="var(--accent-emerald)" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>استعادة قاعدة البيانات</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              رفع ملف نسخة احتياطية سابقة كلي لاسترجاع كافة البيانات والمرفقات في أي وقت.
            </p>
            <label className="btn btn-success" style={{ cursor: 'pointer' }}>
              {isImporting ? 'جاري الاستعادة...' : 'تصفح واستعادة ملف JSON'}
              <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}
