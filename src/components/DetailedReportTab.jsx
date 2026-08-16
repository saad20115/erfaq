import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getEmployeeStats } from '../db/database';
import { 
  Printer, CheckCircle2, XCircle, MinusCircle, 
  FileText, Award, Calendar, DollarSign, ShieldCheck 
} from 'lucide-react';

export default function DetailedReportTab({ employee }) {
  const employeeId = employee?.id;
  const [stats, setStats] = useState(null);

  const contracts = useLiveQuery(
    () => db.contracts.where('employeeId').equals(employeeId).toArray(),
    [employeeId]
  ) || [];

  const salaries = useLiveQuery(
    () => db.salaries.where('employeeId').equals(employeeId).sortBy('yearMonth'),
    [employeeId]
  ) || [];

  const bonuses = useLiveQuery(
    () => db.bonuses.where('employeeId').equals(employeeId).toArray(),
    [employeeId]
  ) || [];

  const otherPayments = useLiveQuery(
    () => db.otherPayments.where('employeeId').equals(employeeId).toArray(),
    [employeeId]
  ) || [];

  const leaves = useLiveQuery(
    () => db.leaves.where('employeeId').equals(employeeId).toArray(),
    [employeeId]
  ) || [];

  useEffect(() => {
    if (employeeId) {
      getEmployeeStats(employeeId).then(setStats);
    }
  }, [employeeId, contracts, salaries, bonuses, otherPayments, leaves]);

  const handlePrint = () => {
    window.print();
  };

  if (!employee) return null;

  return (
    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Report Header Action Bar (Hidden on print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px dashed var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            التقرير التفصيلي والرقابي لمرفقات ورواتب الموظف
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            معاينة جاهزة للطباعة والحفظ كملف PDF
          </p>
        </div>

        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={18} /> طباعة / تصدير PDF
        </button>
      </div>

      {/* Official Print Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '3px double #0f172a', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
          تقرير تتبع المرفقات وإثباتات الصرف والعقود
        </h1>
        <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '0.25rem' }}>
          فترة التتبع: من {employee.startDate || '2020-01'} حتى {employee.endDate || '2025-01'} | تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}
        </div>
      </div>

      {/* Employee Info Box & Compliance Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #cbd5e1' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>
            👤 البيانات الشخصية والوظيفية
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div><strong>اسم الموظف:</strong> {employee.name}</div>
            <div><strong>المسمى الوظيفي:</strong> {employee.jobTitle || 'مهندس مدني'}</div>
            <div><strong>القسم / الإدارة:</strong> {employee.department || 'الهندسة المدنية'}</div>
            <div><strong>فترة التتبع:</strong> من {employee.startDate || '2020-01'} حتى {employee.endDate || '2025-01'}</div>
          </div>
        </div>

        {/* Compliance Gauge Box */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
            معدل اكتمال المرفقات العامة
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: (stats?.complianceRate || 0) >= 80 ? '#059669' : '#dc2626' }}>
            {stats?.complianceRate || 0}%
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
            <span style={{ color: '#065f46', fontWeight: 700 }}>✅ مرفق: {stats?.attachedCount || 0}</span>
            <span style={{ color: '#991b1b', fontWeight: 700 }}>❌ مفقود: {stats?.missingCount || 0}</span>
            <span style={{ color: '#475569', fontWeight: 700 }}>🚫 لا يتطلب: {stats?.naCount || 0}</span>
          </div>
        </div>
      </div>

      {/* 1. Contracts Section */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', borderRight: '4px solid #2563eb', paddingRight: '0.5rem' }}>
          1. عقود العمل وتفاصيلها ({contracts.length})
        </h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>رقم العقد</th>
              <th>فترة العقد</th>
              <th>قيمة العقد</th>
              <th>الملاحظات</th>
              <th>حالة المرفق</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>لا توجد عقود مسجلة</td></tr>
            ) : (
              contracts.map((cnt, idx) => (
                <tr key={cnt.id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 700 }}>{cnt.contractNumber}</td>
                  <td>{cnt.startDate} إلى {cnt.endDate}</td>
                  <td>{(Number(cnt.value) || 0).toLocaleString('ar-SA')} ريال</td>
                  <td style={{ fontSize: '0.85rem' }}>{cnt.notes || '-'}</td>
                  <td>
                    {cnt.status === 'attached' && <span className="status-badge attached">تم الإرفاق ✅</span>}
                    {cnt.status === 'missing' && <span className="status-badge missing">غير مرفق ❌</span>}
                    {cnt.status === 'na' && <span className="status-badge na">لا يتطلب 🚫</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 2. Monthly Salaries Summary Table */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', borderRight: '4px solid #2563eb', paddingRight: '0.5rem' }}>
          2. الرواتب الشهرية من بداية {employee.startDate || '2020-01'} حتى نهاية {employee.endDate || '2025-01'} ({salaries.length} شهراً)
        </h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>السنة والشهر</th>
              <th>الراتب الأساسي</th>
              <th>بدل سيارة</th>
              <th>بدل اتصال</th>
              <th>إجمالي الراتب والبدلات</th>
              <th>الإضافي / المكافآت</th>
              <th>الصافي المستحق</th>
              <th>حالة إثبات الصرف</th>
              <th>ملاحظات الصرف</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((s) => {
              const hasLeave = s.isPaidLeave === true;
              const basicVal = Number(s.basicSalary) !== undefined ? Number(s.basicSalary) : 15000;
              const carVal = s.carAllowance !== undefined ? Number(s.carAllowance) : 1500;
              const phoneVal = s.phoneAllowance !== undefined ? Number(s.phoneAllowance) : 375;
              const grossTotal = basicVal + carVal + phoneVal;
              const bonusVal = Number(s.bonusesOrOvertime) || 0;
              const dedVal = (carVal === 0 && phoneVal === 0) ? 0 : (Number(s.deductions) || 0);
              const computedNet = basicVal + carVal + phoneVal + bonusVal - dedVal;
              return (
                <tr key={s.id} style={hasLeave ? { backgroundColor: 'rgba(14, 165, 233, 0.04)' } : {}}>
                  <td style={{ fontWeight: 700 }}>
                    {s.yearMonth}
                    {hasLeave && (
                      <span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', fontSize: '0.7rem', marginRight: '0.35rem' }}>
                        🏖️ إجازة مدفوعة
                      </span>
                    )}
                  </td>
                  <td>{basicVal.toLocaleString('ar-SA')} ﷼</td>
                  <td style={{ color: '#059669', fontWeight: 600 }}>{carVal.toLocaleString('ar-SA')} ﷼</td>
                  <td style={{ color: '#059669', fontWeight: 600 }}>{phoneVal.toLocaleString('ar-SA')} ﷼</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-900)', backgroundColor: '#f8fafc' }}>{grossTotal.toLocaleString('ar-SA')} ﷼</td>
                  <td style={{ color: bonusVal > 0 ? '#059669' : 'inherit', fontWeight: bonusVal > 0 ? 700 : 400 }}>{bonusVal > 0 ? `${bonusVal.toLocaleString('ar-SA')} ﷼` : '-'}</td>
                  <td style={{ fontWeight: 800 }}>{computedNet.toLocaleString('ar-SA')} ﷼</td>
                  <td>
                    {s.status === 'attached' && <span className="status-badge attached">تم الإرفاق ✅</span>}
                    {s.status === 'missing' && <span className="status-badge missing">غير مرفق ❌</span>}
                    {s.status === 'na' && <span className="status-badge na">لا يتطلب 🚫</span>}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{s.notes || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Bonuses & Overtime Section */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', borderRight: '4px solid #2563eb', paddingRight: '0.5rem' }}>
          3. المكافآت والعمل الإضافي ({bonuses.length})
        </h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>النوع</th>
              <th>التاريخ</th>
              <th>المبلغ المصروف</th>
              <th>البيان</th>
              <th>إثبات الصرف</th>
            </tr>
          </thead>
          <tbody>
            {bonuses.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>لا توجد مكافآت أو إضافي مسجل</td></tr>
            ) : (
              bonuses.map((b, idx) => (
                <tr key={b.id}>
                  <td>{idx + 1}</td>
                  <td>{b.type === 'bonus' ? 'مكافأة' : 'عمل إضافي'}</td>
                  <td>{b.date}</td>
                  <td style={{ fontWeight: 700 }}>{(Number(b.amount) || 0).toLocaleString('ar-SA')} ريال</td>
                  <td style={{ fontSize: '0.85rem' }}>{b.description || '-'}</td>
                  <td>
                    {b.status === 'attached' && <span className="status-badge attached">تم الإرفاق ✅</span>}
                    {b.status === 'missing' && <span className="status-badge missing">غير مرفق ❌</span>}
                    {b.status === 'na' && <span className="status-badge na">لا يتطلب 🚫</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Leaves Section */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', borderRight: '4px solid #2563eb', paddingRight: '0.5rem' }}>
          4. رصيد الإجازات المستخدم ({leaves.length})
        </h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>نوع الإجازة</th>
              <th>فترة الإجازة</th>
              <th>عدد الأيام</th>
              <th>المستحق/الخصم</th>
              <th>إثبات القرار/الصرف</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>لا توجد إجازات مسجلة</td></tr>
            ) : (
              leaves.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 700 }}>{item.leaveType}</td>
                  <td>{item.startDate} إلى {item.endDate}</td>
                  <td>{item.daysCount} يوم</td>
                  <td>{(Number(item.deductionOrPay) || 0).toLocaleString('ar-SA')} ريال</td>
                  <td>
                    {item.status === 'attached' && <span className="status-badge attached">تم الإرفاق ✅</span>}
                    {item.status === 'missing' && <span className="status-badge missing">غير مرفق ❌</span>}
                    {item.status === 'na' && <span className="status-badge na">لا يتطلب 🚫</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Official Signatures Bar */}
      <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '2px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', fontSize: '0.9rem' }}>
        <div>
          <div style={{ fontWeight: 700 }}>إعداد المحاسب / المراجع:</div>
          <div style={{ marginTop: '2.5rem' }}>الاسم والتوقيع: .....................</div>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>اعتماد مدير الموارد البشرية:</div>
          <div style={{ marginTop: '2.5rem' }}>الاسم والتوقيع: .....................</div>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>تنسيق الرقابة المالية:</div>
          <div style={{ marginTop: '2.5rem' }}>الخاتم الرسمي: .....................</div>
        </div>
      </div>
    </div>
  );
}
