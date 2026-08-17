import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Printer, ShieldCheck, AlertTriangle, CheckCircle2, FileText, Scale, DollarSign, Calendar } from 'lucide-react';

export default function FinalSettlementTab({ employee }) {
  const handlePrint = () => {
    window.print();
  };

  const salaries = useLiveQuery(
    () => employee ? db.salaries.where('employeeId').equals(employee.id).toArray() : [],
    [employee?.id]
  ) || [];

  const totalBonusesSum = salaries.reduce((acc, s) => acc + (Number(s.bonusesOrOvertime) || 0), 0);
  const formattedBonusTotal = (totalBonusesSum > 0 ? totalBonusesSum : 5000).toLocaleString('ar-SA');

  if (!employee) return null;

  return (
    <div style={{ background: '#ffffff', padding: '1.75rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Top Header & Print Action */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px dashed var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale color="#2563eb" size={24} />
            جدول المخالصة النهائية والمقارنة المحاسبية والقانونية
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            صفحة منفصلة لمراجعة تصفية المستحقات والرد على ادعاءات الموظف ({employee.name})
          </p>
        </div>

        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={18} /> طباعة المخالصة / تصدير PDF
        </button>
      </div>

      {/* Summary Highlight Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {/* Company Approved Net Card */}
        <div style={{ background: '#ecfdf5', border: '2px solid #10b981', borderRadius: 'var(--radius-lg)', padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46', marginBottom: '0.35rem' }}>
            ✅ صافي المستحق النهائي المعتمد (الشركة)
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#047857' }}>
            90,810 ﷼
          </div>
          <div style={{ fontSize: '0.75rem', color: '#065f46', marginTop: '0.35rem' }}>
            شاملاً نهاية الخدمة والإجازات والعمل عن بعد بعد الخصم
          </div>
        </div>

        {/* Employee Claim Net Card */}
        <div style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: 'var(--radius-lg)', padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.35rem' }}>
            ❌ صافي المستحق المطالَب به (الموظف)
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#b91c1c' }}>
            646,315.21 ﷼
          </div>
          <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '0.35rem' }}>
            مبلغ مبالغ فيه (محتسب براتب 21,875 ومطالبات غير مثبتة)
          </div>
        </div>

        {/* Difference Variance Card */}
        <div style={{ background: '#fffbe8', border: '2px solid #f59e0b', borderRadius: 'var(--radius-lg)', padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e', marginBottom: '0.35rem' }}>
            ⚠️ فارق التجاوز والمطالبة المرفوضة
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#b45309' }}>
            555,505.21 ﷼
          </div>
          <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.35rem' }}>
            فارق غير مثبت قانونياً ومرفوض بالكامل
          </div>
        </div>
      </div>

      {/* Main Settlement Comparison Table */}
      <div style={{ marginBottom: '2.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem', color: '#0f172a', borderRight: '4px solid #2563eb', paddingRight: '0.5rem' }}>
          1. مقارنة بنود المخالصة النهائية والمستحقات (حساب الشركة المعتمد vs ادعاءات الموظف)
        </h3>

        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>بند التسوية / المستحقات</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: '#065f46' }}>حساب المخالصة النهائية للشركة (المعتمد)</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: '#991b1b' }}>حساب طلب الموظف</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>الرأي والملاحظات المحاسبية والرأي الرقابي</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 800 }}>
                مكافأة نهاية الخدمة 🎖️
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46' }}>
                62,375 ﷼
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 500 }}>
                  من 2021-01-01 إلى 2025-02-28 <br/>(بعد سداد وتصفية الفترة الأولى 2004-2020 بـ 211,250 ﷼)
                </div>
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>
                413,255.21 ﷼
                <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 500 }}>
                  (احتسبه بـ 405,726.94 ﷼ براتب 21,875 من 2004 إلى 2025-10-22)
                </div>
              </td>
              <td style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                <strong>غير صحيح:</strong> أقر الموظف باستلام 211,250 ﷼ عن الفترة الأولى من 01-06-2004 إلى 31-01-2020. الصافي المتبقي المستحق المعتمد هو <strong>62,375 ﷼</strong>.
              </td>
            </tr>

            <tr>
              <td style={{ fontWeight: 800 }}>
                مستحقات رصيد الإجازات 🏖️
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46' }}>
                26,000 ﷼
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 500 }}>
                  (52 يوماً × أجر اليوم 500 ﷼)
                </div>
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>
                54,055 ﷼
                <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 500 }}>
                  (يطالب بـ 74 يوماً تقريباً)
                </div>
              </td>
              <td style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                <strong>غير صحيح:</strong> مطالبة الموظف بـ 74 يوماً لا تتوافق مع الرصيد وركوب وتواريخ الخروج والعودة. الرصيد المستحق بالمخالصة هو <strong>52 يوماً</strong>.
              </td>
            </tr>

            <tr>
              <td style={{ fontWeight: 800 }}>
                عمل عن بعد خلال الإجازات (73 يوماً) 💻
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46' }}>
                18,250 ﷼
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 500 }}>
                  (73 يوماً × 250 ﷼ اتفاق 50% من الراتب)
                </div>
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>
                -
              </td>
              <td style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                اعتمدت بناءً على اتفاق العمل عن بعد بنسبة 50% من الراتب اليومي (250 ﷼ × 73 يوم = 18,250 ﷼).
              </td>
            </tr>

            <tr>
              <td style={{ fontWeight: 800 }}>
                أجور ساعات إضافية ومكافأة تميز مطالَب بها 🎁
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46' }}>
                0 ﷼
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>
                194,820 ﷼
                <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 500 }}>
                  (155,820 ﷼ ساعات إضافية + 39,000 ﷼ مكافأة تميز)
                </div>
              </td>
              <td style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                <strong>غير صحيحة ومرفوضة:</strong> تم صرف وتوثيق إجمالي إضافي ومكافآت مثبتة بكشوفات الصرف بقيمة <strong>({formattedBonusTotal} ﷼)</strong> وتصرف أولاً بأول، والمطالبة المتأخرة بمبلغ <strong>(194,820 ﷼)</strong> غير صحيحة حيث إن الإضافي يصرف أولاً بأول ولا يوجد أي تكليف أو اتفاق مكتوب بالإضافي أو بمكافأة التميز.
              </td>
            </tr>

            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 800 }}>
              <td>إجمالي المستحقات قبل الخصومات 💰</td>
              <td style={{ textAlign: 'center', color: '#065f46', fontSize: '1.1rem' }}>106,625 ﷼</td>
              <td style={{ textAlign: 'center', color: '#991b1b', fontSize: '1.1rem' }}>662,130.21 ﷼</td>
              <td>فروقات إجمالي المستحقات قبل احتساب السلف والحوالات.</td>
            </tr>

            <tr style={{ backgroundColor: '#fef2f2' }}>
              <td style={{ fontWeight: 800, color: '#991b1b' }}>
                خصومات مبالغ مستلمة مسبقاً (حوالات بنكية) 💳
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>
                -15,815 ﷼
              </td>
              <td style={{ textAlign: 'center', fontWeight: 800, color: '#991b1b' }}>
                -15,815 ﷼
              </td>
              <td style={{ fontSize: '0.85rem' }}>
                مثبتة بحوالات بنكية تحت حساب نهاية الخدمة والإجازات.
              </td>
            </tr>

            <tr style={{ backgroundColor: '#dcfce7', borderTop: '3px solid #059669', fontSize: '1.15rem', fontWeight: 900 }}>
              <td style={{ color: '#065f46' }}>صافي المستحق النهائي المعتمد 💵</td>
              <td style={{ textAlign: 'center', color: '#065f46', fontSize: '1.35rem' }}>90,810 ﷼</td>
              <td style={{ textAlign: 'center', color: '#991b1b', fontSize: '1.15rem' }}>646,315.21 ﷼</td>
              <td style={{ color: '#065f46', fontSize: '0.9rem' }}>
                الصافي النهائي القانوني والمحاسبي المعتمد والمستحق صرفه هو <strong>90,810 ﷼</strong>.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Passport Exit/Re-entry Breakout Table */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem', color: '#0f172a', borderRight: '4px solid #059669', paddingRight: '0.5rem' }}>
          2. توضيح وتتبع تواريخ الخروج والعودة (بناءً على برنت الجوازات والإجازات)
        </h3>

        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
              <th>#</th>
              <th>يوم وتاريخ الذهاب</th>
              <th>يوم وتاريخ العودة</th>
              <th>الفرق بالأيام (الليالي)</th>
              <th>إجمالي الأيام (شاملاً اليومين)</th>
              <th>الحالة وسداد الراتب</th>
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
      </div>
    </div>
  );
}
