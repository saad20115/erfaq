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
          4. رصيد الإجازات وتتبع الخروج والعودة (برنت الجوازات)
        </h3>
        <table className="custom-table" style={{ marginBottom: '1rem' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>يوم وتاريخ الذهاب</th>
              <th>يوم وتاريخ العودة</th>
              <th>الفرق بالأيام (الليالي)</th>
              <th>إجمالي الأيام (شاملاً اليومين)</th>
              <th>الحالة وسداد الراتب</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1</td><td>الثلاثاء 19-07-2022</td><td>مفقود ❌</td><td>غير محدد</td><td>غير محدد</td><td>استلم راتب كامل</td></tr>
            <tr><td>2</td><td>الثلاثاء 20-09-2022</td><td>الثلاثاء 27-09-2022</td><td>7</td><td>8</td><td>استلم راتب كامل</td></tr>
            <tr><td>3</td><td>الخميس 13-04-2023</td><td>الأحد 30-04-2023</td><td>17</td><td>18</td><td>استلم راتب كامل</td></tr>
            <tr><td>4</td><td>الخميس 17-08-2023</td><td>الأحد 03-09-2023</td><td>17</td><td>18</td><td>استلم راتب كامل</td></tr>
            <tr><td>5</td><td>الإثنين 01-04-2024</td><td>السبت 20-04-2024</td><td>19</td><td>20</td><td>استلم راتب كامل</td></tr>
            <tr><td>6</td><td>الإثنين 23-09-2024</td><td>السبت 05-10-2024</td><td>12</td><td>13</td><td>استلم راتب كامل</td></tr>
            <tr style={{ backgroundColor: '#fef08a', fontWeight: 700 }}>
              <td colSpan={3} style={{ textAlign: 'left' }}>الرصيد المستفاد به (خروج وعودة)</td>
              <td>72</td>
              <td>77</td>
              <td>استلم راتب كامل عن جميع هذه الفترات</td>
            </tr>
            <tr style={{ backgroundColor: '#fef08a', fontWeight: 700 }}>
              <td colSpan={3} style={{ textAlign: 'left' }}>الرصيد المتبقي بالمخالصة المستحق صرفه</td>
              <td>52</td>
              <td>52</td>
              <td>مستحق الصرف (26,000 ﷼)</td>
            </tr>
            <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 800 }}>
              <td colSpan={3} style={{ textAlign: 'left' }}>إجمالي الرصيد المستهلك والمستحق</td>
              <td>124</td>
              <td>129</td>
              <td>الرصيد المستحق التراكمي حتى 2025-02 هو 125 يوماً</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Final Settlement & Audit Comparison Table */}
      <div style={{ marginBottom: '2rem', background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #cbd5e1' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem', color: '#0f172a', borderRight: '4px solid #059669', paddingRight: '0.5rem' }}>
          ⚖️ جدول المخالصة النهائية والمقارنة المحاسبية (حساب الشركة vs ادعاءات الموظف)
        </h3>

        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>البند / البيان</th>
              <th style={{ padding: '0.6rem', textAlign: 'center', backgroundColor: '#065f46' }}>حساب المخالصة النهائية للشركة (المعتمد)</th>
              <th style={{ padding: '0.6rem', textAlign: 'center', backgroundColor: '#991b1b' }}>حساب ادعاءات الموظف</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 700 }}>1. مكافأة نهاية الخدمة</td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46' }}>62,375 ﷼</td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>413,255.21 ﷼</td>
              <td style={{ fontSize: '0.85rem' }}>
                أقر الموظف باستلام 211,250 ﷼ عن الفترة من 2004 حتى 2020. الصافي المتبقي المعتمد للفترة الثانية هو 62,375 ﷼. مطالبتهم بـ 413,255 غير صحيحة.
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700 }}>2. مستحقات رصيد الإجازات</td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46' }}>26,000 ﷼ <br/><span style={{ fontSize: '0.75rem', color: '#475569' }}>(52 يوماً × 500 ﷼)</span></td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>54,055 ﷼ <br/><span style={{ fontSize: '0.75rem', color: '#475569' }}>(يطالب بـ 74 يوماً)</span></td>
              <td style={{ fontSize: '0.85rem' }}>
                مطالبة الموظف بـ 74 يوماً لا تتوافق مع سجلات وتواريخ الخروج والعودة. الرصيد المتبقي المستحق بالمخالصة هو 52 يوماً فقط.
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700 }}>3. عمل عن بعد خلال الإجازات (73 يوماً)</td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46' }}>18,250 ﷼ <br/><span style={{ fontSize: '0.75rem', color: '#475569' }}>(73 يوماً × 250 ﷼ اتفاق 50%)</span></td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>-</td>
              <td style={{ fontSize: '0.85rem' }}>
                احتسبت بناءً على اتفاق العمل عن بعد بنسبة 50% من أجر اليوم (250 ﷼ × 73 يوم = 18,250 ﷼).
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700 }}>4. ساعات إضافية ومكافأة تميز مطالَب بها</td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46' }}>0 ﷼</td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>194,820 ﷼ <br/><span style={{ fontSize: '0.75rem', color: '#475569' }}>(155,820 إضافي + 39,000 تميز)</span></td>
              <td style={{ fontSize: '0.85rem' }}>
                غير صحيحة ومرفوضة. تم صرف وتوثيق إجمالي إضافي ومكافآت مثبتة بكشوفات الصرف بقيمة (5,000 ﷼) وتصرف أولاً بأول، والمطالبة المتأخرة بمبلغ (194,820 ﷼) غير صحيحة حيث إن الإضافي يصرف أولاً بأول ولا يوجد أي تكليف أو اتفاق مكتوب بالإضافي أو التميز.
              </td>
            </tr>
            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 800 }}>
              <td>إجمالي المستحقات قبل الخصومات</td>
              <td style={{ textAlign: 'center', color: '#065f46', fontSize: '1.05rem' }}>106,625 ﷼</td>
              <td style={{ textAlign: 'center', color: '#991b1b', fontSize: '1.05rem' }}>662,130.21 ﷼</td>
              <td>فروقات إجمالي المستحقات قبل الخصم.</td>
            </tr>
            <tr style={{ backgroundColor: '#fef2f2' }}>
              <td style={{ fontWeight: 700, color: '#991b1b' }}>خصومات مبالغ مستلمة مسبقاً (حوالات بنكية)</td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>-15,815 ﷼</td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>-15,815 ﷼</td>
              <td style={{ fontSize: '0.85rem' }}>مثبتة بحوالات بنكية مسددة للموظف تحت حساب نهاية الخدمة والإجازات.</td>
            </tr>
            <tr style={{ backgroundColor: '#dcfce7', borderTop: '2px solid #059669', fontSize: '1.1rem', fontWeight: 900 }}>
              <td style={{ color: '#065f46' }}>صافي المستحق النهائي المعتمد</td>
              <td style={{ textAlign: 'center', color: '#065f46', fontSize: '1.25rem' }}>90,810 ﷼</td>
              <td style={{ textAlign: 'center', color: '#991b1b', fontSize: '1.1rem' }}>646,315.21 ﷼</td>
              <td style={{ color: '#065f46', fontSize: '0.9rem' }}>
                الصافي النهائي القانوني والمحاسبي المستحق للموظف هو <strong>90,810 ﷼</strong>.
              </td>
            </tr>
          </tbody>
        </table>

        {/* Red Audit Callout Note for Service Periods */}
        <div style={{ background: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginTop: '0.75rem', color: '#991b1b', fontSize: '0.82rem', lineHeight: '1.5' }}>
          <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b91c1c' }}>
            📌 ملاحظة بشأن مدة الخدمة مقسمة إلى فترتين:
          </div>
          <ul style={{ margin: 0, paddingRight: '1.2rem', listStyleType: 'disc' }}>
            <li>
              <strong>الفترة الأولى (المسواة والمصفاة سابقاً):</strong> من 01-06-2004 حتى 31-12-2020 ⬅️ مدتها <strong>16 سنة و 7 أشهر (199 شهراً)</strong> — (أقر الموظف باستلام تصفيتها الكاملة بمبلغ 211,250 ﷼ بموجب مخالصات وعقود إلكترونية موثقة وإقرارات شخصية وبناءً على طلبه).
            </li>
            <li>
              <strong>الفترة الثانية (المعتمدة في التصفية بالمخالصة):</strong> من 01-01-2021 حتى 28-02-2025 ⬅️ مدتها <strong>4 سنوات و 2 شهر (50 شهراً)</strong> — (احتسب عنها مكافأة قدرها 62,375 ﷼، واستلم خلالها بحوالات بنكية موثقة مبلغ 15,815 ﷼ على حوالتين: حوالة بمبلغ 8,250 ﷼ وحوالة بمبلغ 7,565 ﷼ تحت حساب نهاية الخدمة والإجازات).
            </li>
            <li>
              <strong>مدة الخدمة الفعلية حتى تاريخ الخروج:</strong> من 01-01-2021 حتى 22-01-2025 ⬅️ مدتها <strong>4 سنوات و 21 يوماً</strong>.
            </li>
            <li>
              <strong>تاريخ نقل الكفالة الفعلي الرسمي:</strong> تم نقل الكفالة بتاريخ <strong>22-10-2025</strong> (حيث بلغت الفترة من 01-01-2021 حتى نقل الكفالة 4 سنوات و 9 أشهر و 21 يوماً).
            </li>
          </ul>
        </div>
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
