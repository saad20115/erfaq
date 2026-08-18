import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Printer, ShieldCheck, AlertTriangle, CheckCircle2, FileText, Scale, DollarSign, Calendar, Edit3 } from 'lucide-react';

export default function FinalSettlementDraftTab({ employee }) {
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = ' ';
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  const salaries = useLiveQuery(
    () => employee ? db.salaries.where('employeeId').equals(employee.id).toArray() : [],
    [employee?.id]
  ) || [];

  const sortedSalaries = [...salaries].sort((a, b) => (b.yearMonth || '').localeCompare(a.yearMonth || ''));
  const totalBonusesSum = salaries.reduce((acc, s) => acc + (Number(s.bonusesOrOvertime) || 0), 0);
  const formattedBonusTotal = (totalBonusesSum > 0 ? totalBonusesSum : 5000).toLocaleString('ar-SA');

  const sumGrossTotal = salaries.reduce((acc, s) => {
    const basic = s.basicSalary !== undefined ? Number(s.basicSalary) : 15000;
    const car = s.carAllowance !== undefined ? Number(s.carAllowance) : 1500;
    const phone = s.phoneAllowance !== undefined ? Number(s.phoneAllowance) : 375;
    return acc + (basic + car + phone);
  }, 0);

  const sumBonuses = salaries.reduce((acc, s) => acc + (Number(s.bonusesOrOvertime) || 0), 0);

  const sumNetReceived = salaries.reduce((acc, s) => {
    const basic = s.basicSalary !== undefined ? Number(s.basicSalary) : 15000;
    const car = s.carAllowance !== undefined ? Number(s.carAllowance) : 1500;
    const phone = s.phoneAllowance !== undefined ? Number(s.phoneAllowance) : 375;
    const bonus = Number(s.bonusesOrOvertime) || 0;
    const ded = (car === 0 && phone === 0) ? 0 : (Number(s.deductions) || 0);
    return acc + (basic + car + phone + bonus - ded);
  }, 0);

  if (!employee) return null;

  return (
    <div style={{ background: '#ffffff', padding: '1.75rem', borderRadius: 'var(--radius-xl)', border: '2px solid #8b5cf6', boxShadow: 'var(--shadow-sm)' }}>
      {/* Top Header & Print Action */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px dashed var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 color="#8b5cf6" size={24} />
            جدول المخالصة النهائية والردود (نسخة إضافية معدلة)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            نسخة إضافية مخصصة لتجربة التعديلات والسيناريوهات المختلفة للموظف ({employee.name})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={handlePrint} style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>
            <Printer size={18} /> طباعة النسخة المعدلة / PDF
          </button>
        </div>
      </div>

      {/* Summary Highlight Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {/* Company Approved Net Card */}
        <div style={{ background: '#ecfdf5', border: '1.5px solid #10b981', borderRadius: 'var(--radius-md)', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46', marginBottom: '0.2rem' }}>
            ✅ صافي المستحق النهائي المعتمد (النسخة المعدلة)
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#047857' }}>
            97,312.50 ﷼
          </div>
          <div style={{ fontSize: '0.7rem', color: '#065f46', marginTop: '0.2rem' }}>
            شاملاً نهاية الخدمة بـ 50,462.50 ﷼ + الإجازات بـ 28,600 ﷼ والعمل عن بعد بـ 18,250 ﷼
          </div>
        </div>

        {/* Employee Claim Net Card */}
        <div style={{ background: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: 'var(--radius-md)', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.2rem' }}>
            ❌ صافي المستحق المطالَب به (الموظف)
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#b91c1c' }}>
            646,315.21 ﷼
          </div>
          <div style={{ fontSize: '0.7rem', color: '#991b1b', marginTop: '0.2rem' }}>
            مبلغ مبالغ فيه (محتسب براتب 21,875 ومطالبات غير مثبتة)
          </div>
        </div>

        {/* Difference Variance Card */}
        <div style={{ background: '#fffbe8', border: '1.5px solid #f59e0b', borderRadius: 'var(--radius-md)', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e', marginBottom: '0.2rem' }}>
            ⚠️ فارق التجاوز والمطالبة المرفوضة
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#b45309' }}>
            549,002.71 ﷼
          </div>
          <div style={{ fontSize: '0.7rem', color: '#92400e', marginTop: '0.2rem' }}>
            فارق غير مثبت قانونياً ومرفوض بالكامل
          </div>
        </div>
      </div>

      {/* Main Settlement Comparison Table */}
      <div style={{ marginBottom: '2.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem', color: '#0f172a', borderRight: '4px solid #8b5cf6', paddingRight: '0.5rem' }}>
          1. مقارنة بنود المخالصة النهائية والمستحقات (النسخة الإضافية المعدلة)
        </h3>

        <table className="custom-table print-landscape-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <th style={{ padding: '0.6rem 0.4rem', textAlign: 'right', width: '20%' }}>بند التسوية / المستحقات</th>
              <th className="header-company-approved" style={{ padding: '0.65rem 0.4rem', textAlign: 'center', backgroundColor: '#064e3b', color: '#ffffff', width: '22%', fontWeight: 900 }}>
                حساب المخالصة النهائية للشركة (المعتمد)
              </th>
              <th className="header-employee-claim" style={{ padding: '0.65rem 0.4rem', textAlign: 'center', backgroundColor: '#7f1d1d', color: '#ffffff', width: '22%', fontWeight: 900 }}>
                حساب طلب الموظف
              </th>
              <th style={{ padding: '0.6rem 0.4rem', textAlign: 'right', width: '36%' }}>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 800 }}>
                مكافأة نهاية الخدمة 🎖️
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46' }}>
                50,462.50 ﷼
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 500 }}>
                  من 2022-01-01 إلى 2025-01-22 براتب 16,500 ﷼
                </div>
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>
                413,255.21 ﷼
                <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 500 }}>
                  (احتسبه بـ 405,726.94 ﷼ براتب 21,875 من 2004 إلى 2025-10-22)
                </div>
              </td>
              <td style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                <strong>غير صحيح:</strong> احتسبت نهاية الخدمة للفترة الجديدة من <strong>01-01-2022 حتى 22-01-2025</strong> على أساس راتب <strong>16,500 ﷼</strong> لتبلغ مكافأة نهاية الخدمة المعتمدة <strong>50,462.50 ﷼</strong>.
              </td>
            </tr>

            <tr>
              <td style={{ fontWeight: 800 }}>
                مستحقات رصيد الإجازات 🏖️
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46' }}>
                28,600 ﷼
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 500 }}>
                  (52 يوماً × أجر اليوم 550 ﷼ براتب 16,500 ﷼)
                </div>
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>
                54,055 ﷼
                <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 500 }}>
                  (يطالب بـ 74 يوماً براتب 21,875 ﷼)
                </div>
              </td>
              <td style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                <strong>غير صحيح:</strong> مطالبتهم بـ 74 يوماً لا تتوافق مع برنت الجوازات. الرصيد المتبقي المستحق بالمخالصة هو <strong>52 يوماً بواقع 550 ﷼/يوم</strong> بقيمة <strong>28,600 ﷼</strong>.
              </td>
            </tr>

            <tr>
              <td style={{ fontWeight: 800 }}>
                راتب شهر يناير 2025 + أجر عمل عن بعد 💻
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46' }}>
                18,250 ﷼
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 500 }}>
                  (راتب يناير 16,875 ﷼ + أجر عمل عن بعد 1,375 ﷼)
                </div>
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>
                143,000 ﷼
                <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 500 }}>
                  (يطالب بأجور أشهر كاملة بدون إثبات)
                </div>
              </td>
              <td style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                تم سداد راتب يناير 2025 بحوالات البنك السعودي للاستثمار. تم احتساب مبلغ 1,375 ﷼ إضافي عن فترة العمل عن بعد المعتمدة.
              </td>
            </tr>

            <tr>
              <td style={{ fontWeight: 800 }}>
                أجور ساعات إضافية ومكافأة تميز مطالَب بها 🎁
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46' }}>
                0 ﷼
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 500 }}>
                  (تم صرف كافة الإضافيات الموثقة سابقاً)
                </div>
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>
                36,000 ﷼
              </td>
              <td style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                إجمالي المكافآت والإضافي الموثق المصروف للموظف في النظام هو ({formattedBonusTotal} ﷼) ولا توجد أي ساعات إضافية غير مسددة.
              </td>
            </tr>

            <tr style={{ backgroundColor: '#ecfdf5', fontWeight: 900, borderTop: '2px solid #059669', borderBottom: '2px solid #059669' }}>
              <td style={{ fontWeight: 900, color: '#065f46', fontSize: '1rem' }}>
                🎯 صافي المبلغ النهائي المستحق صرفه بالمخالصة
              </td>
              <td style={{ textAlign: 'center', fontWeight: 900, color: '#047857', fontSize: '1.25rem', backgroundColor: '#d1fae5' }}>
                97,312.50 ﷼
              </td>
              <td style={{ textAlign: 'center', fontWeight: 900, color: '#b91c1c', fontSize: '1.25rem', backgroundColor: '#fee2e2' }}>
                646,315.21 ﷼
              </td>
              <td style={{ color: '#065f46', fontSize: '0.9rem' }}>
                الصافي النهائي المعتمد بالمخالصة في هذه النسخة المعدلة هو <strong>97,312.50 ﷼</strong>.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Passport Exit/Re-entry Breakout Table */}
      <div className="print-page-break-before" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem', color: '#0f172a', borderRight: '4px solid #059669', paddingRight: '0.5rem' }}>
          2. توضيح وتتبع تواريخ الخروج والعودة (بناءً على برنت الجوازات والإجازات)
        </h3>

        <table className="custom-table print-landscape-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <th style={{ width: '5%', textAlign: 'center', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 900, padding: '0.65rem 0.2rem' }}>#</th>
              <th style={{ width: '20%', textAlign: 'center', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 900, padding: '0.65rem 0.2rem' }}>يوم وتاريخ الذهاب</th>
              <th style={{ width: '20%', textAlign: 'center', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 900, padding: '0.65rem 0.2rem' }}>يوم وتاريخ العودة</th>
              <th style={{ width: '15%', textAlign: 'center', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 900, padding: '0.65rem 0.2rem' }}>الفرق بالأيام (الليالي)</th>
              <th style={{ width: '18%', textAlign: 'center', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 900, padding: '0.65rem 0.2rem' }}>إجمالي الأيام (شاملاً اليومين)</th>
              <th style={{ width: '22%', textAlign: 'center', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 900, padding: '0.65rem 0.2rem' }}>الحالة وسداد الراتب</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>الثلاثاء 19-07-2022</td>
              <td>مفقود ❌</td>
              <td>غير محدد</td>
              <td>غير محدد</td>
              <td><span className="status-badge attached">استلم راتب كامل</span></td>
            </tr>
            <tr>
              <td>2</td>
              <td>الثلاثاء 20-09-2022</td>
              <td>الثلاثاء 27-09-2022</td>
              <td style={{ fontWeight: 700 }}>7</td>
              <td style={{ fontWeight: 700 }}>8</td>
              <td><span className="status-badge attached">استلم راتب كامل</span></td>
            </tr>
            <tr>
              <td>3</td>
              <td>الخميس 13-04-2023</td>
              <td>الأحد 30-04-2023</td>
              <td style={{ fontWeight: 700 }}>17</td>
              <td style={{ fontWeight: 700 }}>18</td>
              <td><span className="status-badge attached">استلم راتب كامل</span></td>
            </tr>
            <tr>
              <td>4</td>
              <td>الخميس 17-08-2023</td>
              <td>الأحد 03-09-2023</td>
              <td style={{ fontWeight: 700 }}>17</td>
              <td style={{ fontWeight: 700 }}>18</td>
              <td><span className="status-badge attached">استلم راتب كامل</span></td>
            </tr>
            <tr>
              <td>5</td>
              <td>الإثنين 01-04-2024</td>
              <td>السبت 20-04-2024</td>
              <td style={{ fontWeight: 700 }}>19</td>
              <td style={{ fontWeight: 700 }}>20</td>
              <td><span className="status-badge attached">استلم راتب كامل</span></td>
            </tr>
            <tr>
              <td>6</td>
              <td>الإثنين 23-09-2024</td>
              <td>السبت 05-10-2024</td>
              <td style={{ fontWeight: 700 }}>12</td>
              <td style={{ fontWeight: 700 }}>13</td>
              <td><span className="status-badge attached">استلم راتب كامل</span></td>
            </tr>
            <tr style={{ backgroundColor: '#fef08a', fontWeight: 800 }}>
              <td colSpan={3} style={{ textAlign: 'left' }}>الرصيد المستفاد به (خروج وعودة)</td>
              <td style={{ color: '#854d0e', fontSize: '1rem' }}>72</td>
              <td style={{ color: '#854d0e', fontSize: '1rem' }}>77</td>
              <td>استلم راتب كامل عن جميع هذه الفترات</td>
            </tr>
            <tr style={{ backgroundColor: '#fef08a', fontWeight: 800 }}>
              <td colSpan={3} style={{ textAlign: 'left' }}>الرصيد المتبقي بالمخالصة المستحق صرفه</td>
              <td style={{ color: '#854d0e', fontSize: '1rem' }}>52</td>
              <td style={{ color: '#854d0e', fontSize: '1rem' }}>52</td>
              <td>مستحق الصرف بقيمة (26,000 ﷼)</td>
            </tr>
            <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 900 }}>
              <td colSpan={3} style={{ textAlign: 'left' }}>إجمالي الرصيد المستهلك والمستحق</td>
              <td style={{ fontSize: '1.05rem', color: '#0f172a' }}>124</td>
              <td style={{ fontSize: '1.05rem', color: '#0f172a' }}>129</td>
              <td>الرصيد التراكمي المستحق حتى نهاية فبراير 2025 هو 125 يوماً</td>
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
              <strong>الفترة الأولى (المسواة والمصفاة سابقاً):</strong> من 01-06-2004 حتى 31-01-2020 ⬅️ مدتها <strong>15 سنة و 8 أشهر (188 شهراً)</strong> — (أقر الموظف باستلام تصفيتها الكاملة بمبلغ 211,250 ﷼ بموجب مخالصات وعقود إلكترونية موثقة وإقرارات شخصية وبناءً على طلبه).
            </li>
            <li>
              <strong>الفترة الثانية (النسخة الإضافية المعدلة):</strong> تم احتساب مكافأة نهاية الخدمة بالنسخة المعدلة من <strong>01-01-2022 حتى 22-01-2025</strong> على أساس راتب <strong>16,500 ﷼</strong> لتبلغ <strong>50,462.50 ﷼</strong> (بدلاً من 62,375 ﷼)، مع استلام الموظف لحوالتين موثقتين بمبلغ 15,815 ﷼ تحت الحساب.
            </li>
            <li>
              <strong>آخر يوم عمل فعلي للموظف:</strong> <strong>22-01-2025</strong> (حيث بلغت الفترة من 01-01-2021 حتى آخر يوم عمل فعلي 4 سنوات و 21 يوماً).
            </li>
            <li>
              <strong>تاريخ انتهاء العلاقة التعاقدية ونقل الكفالة الفعلي:</strong> تم نقل الكفالة بتاريخ <strong>22-10-2025</strong> (حيث بلغت الفترة من 01-01-2021 حتى نقل الكفالة 4 سنوات و 9 أشهر و 21 يوماً).
            </li>
          </ul>
        </div>
      </div>

      {/* Section 3: Detailed Monthly Salaries Statement Table (2025-01 down to 2020-01) */}
      <div className="print-page-break-before" style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem', color: '#0f172a', borderRight: '4px solid #3b82f6', paddingRight: '0.5rem' }}>
          3. البيان التفصيلي لكشوفات الرواتب الشهرية والبدلات (مرتبة هبوطياً من يناير 2025 إلى يناير 2020)
        </h3>

        <table className="custom-table print-landscape-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <th style={{ width: '5%', textAlign: 'center', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 900, padding: '0.65rem 0.2rem' }}>#</th>
              <th style={{ width: '15%', textAlign: 'center', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 900, padding: '0.65rem 0.2rem' }}>الشهر / السنة</th>
              <th className="header-gross-total" style={{ width: '20%', textAlign: 'center', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: 900, padding: '0.65rem 0.2rem' }}>إجمالي الراتب والبدلات 📊</th>
              <th className="header-bonus-total" style={{ width: '18%', textAlign: 'center', backgroundColor: '#78350f', color: '#ffffff', fontWeight: 900, padding: '0.65rem 0.2rem' }}>إجمالي الإضافي 🎁</th>
              <th className="header-net-total" style={{ width: '20%', textAlign: 'center', backgroundColor: '#064e3b', color: '#ffffff', fontWeight: 900, padding: '0.65rem 0.2rem' }}>إجمالي المستلم 💵</th>
              <th style={{ width: '22%', textAlign: 'right', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 900, padding: '0.65rem 0.4rem' }}>الملاحظات 📝</th>
            </tr>
          </thead>
          <tbody>
            {sortedSalaries.map((s, idx) => {
              const basic = s.basicSalary !== undefined ? Number(s.basicSalary) : 15000;
              const car = s.carAllowance !== undefined ? Number(s.carAllowance) : 1500;
              const phone = s.phoneAllowance !== undefined ? Number(s.phoneAllowance) : 375;
              const grossTotal = basic + car + phone;
              const bonus = Number(s.bonusesOrOvertime) || 0;
              const ded = (car === 0 && phone === 0) ? 0 : (Number(s.deductions) || 0);
              const net = basic + car + phone + bonus - ded;

              return (
                <tr key={s.id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{sortedSalaries.length - idx}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: '#1e293b' }}>{s.yearMonth}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: '#1e3a8a', backgroundColor: 'rgba(30, 58, 138, 0.04)' }}>
                    {grossTotal.toLocaleString('ar-SA')} ﷼
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: bonus > 0 ? '#b45309' : '#64748b' }}>
                    {bonus > 0 ? `${bonus.toLocaleString('ar-SA')} ﷼` : '-'}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 900, color: '#047857', backgroundColor: 'rgba(4, 120, 87, 0.05)' }}>
                    {net.toLocaleString('ar-SA')} ﷼
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#334155' }}>
                    {s.notes ? s.notes : (s.isPaidLeave ? `إجازة مدفوعة (${s.paidLeaveType || 'سنوية'})` : '-')}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 900, borderTop: '3px solid #3b82f6', fontSize: '0.9rem' }}>
              <td colSpan={2} style={{ textAlign: 'center', padding: '0.66rem 0.4rem' }}>
                📊 الإجمالي الكلي ({salaries.length} شهراً)
              </td>
              <td style={{ textAlign: 'center', color: '#93c5fd', backgroundColor: '#1e3a8a' }}>
                {sumGrossTotal.toLocaleString('ar-SA')} ﷼
              </td>
              <td style={{ textAlign: 'center', color: '#fde047', backgroundColor: '#78350f' }}>
                {sumBonuses.toLocaleString('ar-SA')} ﷼
              </td>
              <td style={{ textAlign: 'center', color: '#6ee7b7', backgroundColor: '#065f46' }}>
                {sumNetReceived.toLocaleString('ar-SA')} ﷼
              </td>
              <td style={{ textAlign: 'right', fontSize: '0.78rem', color: '#cbd5e1', padding: '0.66rem 0.4rem' }}>
                إجمالي مسيرات الرواتب والإضافي المصروفة
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
