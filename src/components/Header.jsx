import React from 'react';
import { 
  FileCheck, UserPlus, Database, RefreshCw, 
  Search, Award, Layers 
} from 'lucide-react';
import { seedDemoDataIfEmpty, syncWithServer } from '../db/database';

export default function Header({ 
  employees = [], 
  selectedEmpId, 
  onSelectEmp, 
  onOpenNewEmpModal, 
  onOpenBackupModal,
  activeMainTab,
  setActiveMainTab
}) {
  const handleLoadDemo = async () => {
    if (window.confirm('هل ترغب في تحميل بيانات نموذجية تجريبية (للموظف أحمد العتيبي والسلسلة الزمنية 2020-2025)؟')) {
      await seedDemoDataIfEmpty();
      window.location.reload();
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Logo & App Title */}
        <div className="logo-area">
          <div className="logo-icon">
            <FileCheck size={28} color="#3b82f6" />
          </div>
          <div>
            <div className="logo-title">نظام تتبع المرفقات والرواتب</div>
            <div className="logo-subtitle">نظام تتبع إثباتات الصرف والعقود المستندية (2020 - 2025)</div>
          </div>
        </div>

        {/* Main View Switcher: Individual Employee vs Aggregate Dashboard */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(255,255,255,0.08)', padding: '0.25rem', borderRadius: 'var(--radius-lg)' }}>
          <button 
            className={`btn btn-sm ${activeMainTab === 'employee' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeMainTab !== 'employee' ? { background: 'transparent', color: '#cbd5e1', border: 'none' } : {}}
            onClick={() => setActiveMainTab('employee')}
          >
            <Layers size={16} /> ملف وتفاصيل الموظف
          </button>
          <button 
            className={`btn btn-sm ${activeMainTab === 'aggregate' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeMainTab !== 'aggregate' ? { background: 'transparent', color: '#cbd5e1', border: 'none' } : {}}
            onClick={() => setActiveMainTab('aggregate')}
          >
            <Award size={16} /> التقرير المجمع للجميع
          </button>
        </div>

        {/* Employee Dropdown & Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {activeMainTab === 'employee' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>الموظف المحدد:</span>
              <select 
                value={selectedEmpId || ''} 
                onChange={(e) => onSelectEmp(Number(e.target.value))}
                className="form-control"
                style={{ width: '220px', background: '#1e293b', color: '#ffffff', borderColor: '#475569', fontWeight: 600 }}
              >
                {employees.length === 0 ? (
                  <option value="">لا يوجد موظفون</option>
                ) : (
                  employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.jobTitle || 'مهندس مدني'})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <button className="btn btn-secondary btn-sm" onClick={onOpenNewEmpModal}>
            <UserPlus size={16} /> موظف جديد
          </button>

          <button 
            className="btn btn-primary btn-sm" 
            onClick={async () => {
              const synced = await syncWithServer();
              if (synced) alert('✅ تم مزامنة كامل المرفقات والتحديدات فورياً مع سيرفر الفريق (MySQL)!');
              else alert('⚡ تم التنسيق مع قاعدة البيانات المحلية وسيرفر الفريق.');
            }}
            title="مزامنة فورية مع السيرفر لتلقي مرفقات وتعديلات الفريق الحية"
            style={{ backgroundColor: '#059669', borderColor: '#059669', color: '#ffffff' }}
          >
            <RefreshCw size={16} /> مزامنة الفريق الحية
          </button>

          <button className="btn btn-secondary btn-sm" onClick={onOpenBackupModal} title="تصدير واستعادة النسخة الاحتياطية">
            <Database size={16} /> الحفظ والاستعادة
          </button>

          <button className="btn btn-secondary btn-sm" onClick={handleLoadDemo} title="تحميل بيانات عينة">
            <RefreshCw size={16} /> بيانات تجريبية
          </button>
        </div>
      </div>
    </header>
  );
}
