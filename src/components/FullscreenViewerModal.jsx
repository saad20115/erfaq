import React, { useState } from 'react';
import { 
  X, Download, ZoomIn, ZoomOut, RotateCcw, 
  Square, Eye, Check
} from 'lucide-react';
import { db } from '../db/database';

export default function FullscreenViewerModal({ attachment, onClose, onSaveHighlight }) {
  if (!attachment) return null;

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isHighlightActive, setIsHighlightActive] = useState(attachment.highlightBox?.active ?? true);
  const [highlightBox, setHighlightBox] = useState(attachment.highlightBox || {
    y: 70, // percentage from top (default to bottom section e.g. SAIB statement row)
    height: 18, // percentage height
    width: 96,
    x: 2,
    active: true
  });

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => { setZoom(1); setRotation(0); };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleSaveHighlight = async () => {
    const updatedBox = { ...highlightBox, active: isHighlightActive };
    await db.attachments.update(attachment.id, { highlightBox: updatedBox });
    await pushToServer();
    if (onSaveHighlight) {
      onSaveHighlight({ ...attachment, highlightBox: updatedBox });
    }
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = attachment.fileData;
    a.download = attachment.fileName;
    a.click();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 120, backgroundColor: 'rgba(0, 0, 0, 0.88)' }} onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '98vw', 
          width: '98vw', 
          height: '95vh', 
          padding: '1rem', 
          display: 'flex', 
          flexDirection: 'column', 
          backgroundColor: '#0f172a', 
          color: '#f8fafc',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Toolbar Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #334155', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye color="#38bdf8" size={22} />
              معاينة المستند بالكامل: {attachment.fileName}
            </h3>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#1e293b', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid #475569' }}>
              <button className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.4rem' }} onClick={handleZoomOut} title="تصغير"><ZoomOut size={15} /></button>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: '45px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
              <button className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.4rem' }} onClick={handleZoomIn} title="تكبير"><ZoomIn size={15} /></button>
              <button className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.4rem' }} onClick={handleRotate} title="تدوير المستند 90 درجة"><RotateCcw size={14} /></button>
              <button className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} onClick={handleResetZoom} title="إعادة تعيين">100%</button>
            </div>

            {/* Highlight Spotlight Tool Toggle */}
            <button 
              className={`btn btn-sm ${isHighlightActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', gap: '0.35rem' }}
              onClick={() => setIsHighlightActive(!isHighlightActive)}
            >
              <Square size={15} />
              {isHighlightActive ? 'إلغاء إطار التمييز 🔲' : 'تحديد جزء معين بمربع إطار شفاف 🔍'}
            </button>

            {/* Download Button */}
            <button className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', gap: '0.3rem' }} onClick={handleDownload}>
              <Download size={15} /> تنزيل
            </button>

            {/* Close Modal */}
            <button className="btn btn-secondary btn-icon" style={{ color: '#fff', backgroundColor: '#334155' }} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Spotlight Region Settings Bar (Shown when highlight tool is active) */}
        {isHighlightActive && (
          <div style={{ background: '#1e293b', padding: '0.5rem 0.85rem', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>🔍 تحديد الجزء المطلوب بالتركيز:</span>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }} onClick={() => setHighlightBox({ y: 70, height: 18, width: 96, x: 2, active: true })}>أسفل الكشف (سطر الموظف) ⬇️</button>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }} onClick={() => setHighlightBox({ y: 40, height: 25, width: 96, x: 2, active: true })}>منتصف الكشف ↕️</button>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }} onClick={() => setHighlightBox({ y: 10, height: 25, width: 96, x: 2, active: true })}>أعلى الكشف ⬆️</button>
            </div>

            {/* Manual Sliders for Top position & Height */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                الموقع العمودي:
                <input 
                  type="range" 
                  min="0" 
                  max="90" 
                  value={highlightBox.y} 
                  onChange={(e) => setHighlightBox({ ...highlightBox, y: Number(e.target.value) })}
                  style={{ width: '90px' }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                ارتفاع الإطار:
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  value={highlightBox.height} 
                  onChange={(e) => setHighlightBox({ ...highlightBox, height: Number(e.target.value) })}
                  style={{ width: '90px' }}
                />
              </label>
              <button className="btn btn-success btn-sm" style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem', gap: '0.2rem' }} onClick={handleSaveHighlight}>
                <Check size={13} /> حفظ موضع الإطار
              </button>

              {saveSuccessMsg && (
                <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 700, animation: 'fadeIn 0.2s' }}>
                  ✅ تم حفظ موضع الإطار بنجاح!
                </span>
              )}
            </div>
          </div>
        )}

        {/* Main Document Display Area */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#020617', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div 
            style={{ 
              position: 'relative', 
              display: 'inline-block',
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out'
            }}
          >
            {attachment.fileType.startsWith('image/') ? (
              <img 
                src={attachment.fileData} 
                alt={attachment.fileName} 
                style={{ maxWidth: '90vw', maxHeight: '75vh', objectFit: 'contain', display: 'block', borderRadius: '4px' }} 
              />
            ) : (
              <iframe 
                src={attachment.fileData} 
                title={attachment.fileName} 
                style={{ width: '85vw', height: '72vh', border: 'none', borderRadius: '4px' }} 
              />
            )}

            {/* Spotlight Transparent Highlight Frame Overlay */}
            {isHighlightActive && (
              <div 
                style={{ 
                  position: 'absolute', 
                  top: `${highlightBox.y}%`, 
                  left: `${highlightBox.x}%`, 
                  width: `${highlightBox.width}%`, 
                  height: `${highlightBox.height}%`, 
                  border: '3px solid #2563eb', 
                  backgroundColor: 'rgba(37, 99, 235, 0.18)', 
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)', 
                  borderRadius: '6px', 
                  pointerEvents: 'none',
                  zIndex: 20
                }}
              >
                <div style={{ position: 'absolute', top: '-24px', right: '0', background: '#2563eb', color: '#fff', padding: '0.1rem 0.4rem', fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px 4px 0 0' }}>
                  🎯 المنطقة المحددة / سطر البيانات
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
