import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getEmployeeStats } from '../db/database';
import { 
  Users, CheckCircle2, XCircle, MinusCircle, 
  Search, Printer, Award, ArrowLeft, ShieldAlert 
} from 'lucide-react';

export default function AggregateDashboardTab({ onSelectEmployee }) {
  const [employeeStatsMap, setEmployeeStatsMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMissingOnly, setFilterMissingOnly] = useState(false);

  const employees = useLiveQuery(() => db.employees.toArray()) || [];

  useEffect(() => {
    async function loadAllStats() {
      const map = {};
      for (const emp of employees) {
        map[emp.id] = await getEmployeeStats(emp.id);
      }
      setEmployeeStatsMap(map);
    }
    if (employees.length > 0) {
      loadAllStats();
    }
  }, [employees]);

  // Aggregate KPI Calculations
  const totalEmployeesCount = employees.length;
  let globalAttached = 0;
  let globalMissing = 0;
  let globalNA = 0;
  let globalSalariesPaid = 0;

  Object.values(employeeStatsMap).forEach(st => {
    globalAttached += st.attachedCount || 0;
    globalMissing += st.missingCount || 0;
    globalNA += st.naCount || 0;
    globalSalariesPaid += st.totalSalariesPaid || 0;
  });

  const globalTotalRequired = globalAttached + globalMissing;
  const globalComplianceRate = globalTotalRequired > 0 ? Math.round((globalAttached / globalTotalRequired) * 100) : 100;

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const st = employeeStatsMap[emp.id];
    if (filterMissingOnly && st && st.missingCount === 0) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = emp.name.toLowerCase().includes(term);
      const idMatch = (emp.empId || '').toLowerCase().includes(term);
      const civilMatch = (emp.civilId || '').toLowerCase().includes(term);
      if (!nameMatch && !idMatch && !civilMatch) return false;
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Printable Report Header */}
      <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award color="var(--primary-600)" size={26} />
              التقرير المجمع ولوحة تتبع كافة الموظفين
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              نظرة عامة وشاملة على معدل اكتمال المرفقات للمؤسسة والشركة
            </p>
          </div>

          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} /> طباعة التقرير المجمع PDF
          </button>
        </div>

        {/* Global KPI Stats Grid */}
        <div className="grid-4">
          <div className="stat-card" style={{ borderColor: '#cbd5e1' }}>
            <div className="stat-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
              <Users size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{totalEmployeesCount}</div>
              <div className="stat-label">إجمالي الموظفين المسجلين</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderColor: globalComplianceRate >= 80 ? '#a7f3d0' : '#fecaca' }}>
            <div className="stat-icon" style={{ background: globalComplianceRate >= 80 ? 'var(--accent-emerald-light)' : 'var(--accent-rose-light)', color: globalComplianceRate >= 80 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              <Award size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: globalComplianceRate >= 80 ? '#059669' : '#dc2626' }}>
                {globalComplianceRate}%
              </div>
              <div className="stat-label">معدل الانضباط التراكمي للمرفقات</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderColor: '#a7f3d0' }}>
            <div className="stat-icon" style={{ background: 'var(--accent-emerald-light)', color: '#065f46' }}>
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: '#065f46' }}>{globalAttached}</div>
              <div className="stat-label">إجمالي المستندات المرفقة ✅</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderColor: '#fecaca' }}>
            <div className="stat-icon" style={{ background: 'var(--accent-rose-light)', color: '#991b1b' }}>
              <XCircle size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: '#991b1b' }}>{globalMissing}</div>
              <div className="stat-label">مستندات وإثباتات مفقودة ❌</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filtering Bar (No print) */}
      <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            className="form-control"
            placeholder="ابحث باسم الموظف، الرقم الوظيفي، أو رقم الهوية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-rose)' }}>
          <input 
            type="checkbox" 
            checked={filterMissingOnly}
            onChange={(e) => setFilterMissingOnly(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          عرض الموظفين ذوي المرفقات المفقودة فقط ❌
        </label>
      </div>

      {/* Aggregate Employees Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            جدول تتبع المرفقات المجمع لكافة الموظفين ({filteredEmployees.length})
          </h3>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>اسم الموظف والتفاصيل</th>
                <th>فترة التتبع</th>
                <th>نسبة الانضباط %</th>
                <th>حالة المرفقات (✅ / ❌ / 🚫)</th>
                <th>إجمالي الرواتب المصروفة</th>
                <th className="no-print">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    لا يوجد موظفون يطابقون خيارات البحث والتصفية.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, idx) => {
                  const st = employeeStatsMap[emp.id] || {};
                  const rate = st.complianceRate || 0;

                  return (
                    <tr key={emp.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-900)' }}>
                          {emp.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          رقم: {emp.empId || '-'} | قسم: {emp.department || '-'}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        من {emp.startDate || '2020-01'} حتى {emp.endDate || '2025-01'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-bar-bg" style={{ width: '80px' }}>
                            <div 
                              className="progress-bar-fill" 
                              style={{ 
                                width: `${rate}%`, 
                                backgroundColor: rate >= 80 ? 'var(--accent-emerald)' : (rate >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)') 
                              }} 
                            />
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: rate >= 80 ? '#059669' : '#dc2626' }}>
                            {rate}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <span className="status-badge attached">✅ مرفق: {st.attachedCount || 0}</span>
                          <span className={`status-badge ${st.missingCount > 0 ? 'missing' : 'na'}`}>
                            ❌ مفقود: {st.missingCount || 0}
                          </span>
                          <span className="status-badge na">🚫 لا يتطلب: {st.naCount || 0}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-800)' }}>
                        {(st.totalSalariesPaid || 0).toLocaleString('ar-SA')} ﷼
                      </td>
                      <td className="no-print">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => onSelectEmployee(emp.id)}
                        >
                          فتح ملف الموظف والتفاصيل <ArrowLeft size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
