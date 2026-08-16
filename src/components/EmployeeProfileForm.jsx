import React, { useState, useEffect } from 'react';
import { db, ensureMonthlySalaryRecords } from '../db/database';
import { User, Calendar, Save, Trash2, Edit3, Briefcase, FileText } from 'lucide-react';

export default function EmployeeProfileForm({ employee, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    name: '',
    empId: '',
    civilId: '',
    jobTitle: '',
    department: '',
    startDate: '2020-01',
    endDate: '2025-01',
    defaultSalary: 10000,
    notes: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        empId: employee.empId || '',
        civilId: employee.civilId || '',
        jobTitle: employee.jobTitle || '',
        department: employee.department || '',
        startDate: employee.startDate || '2020-01',
        endDate: employee.endDate || '2025-01',
        defaultSalary: employee.defaultSalary || 10000,
        notes: employee.notes || ''
      });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم الموظف');
      return;
    }

    let empId = employee?.id;

    if (employee && employee.id) {
      await db.employees.update(employee.id, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
    } else {
      empId = await db.employees.add({
        ...formData,
        createdAt: new Date().toISOString()
      });
    }

    // Automatically generate/ensure all monthly salary records exist for period
    await ensureMonthlySalaryRecords(empId, formData.startDate, formData.endDate, formData.defaultSalary);

    setIsEditing(false);
    if (onSave) onSave(empId);
  };

  const handleDelete = async () => {
    if (employee && employee.id && window.confirm(`هل أنت تأكد من حذف الموظف "${employee.name}" وكافة مرفقاته ورواتبه وعقوده نهائياً؟`)) {
      const id = employee.id;
      await db.employees.delete(id);
      await db.contracts.where('employeeId').equals(id).delete();
      await db.salaries.where('employeeId').equals(id).delete();
      await db.bonuses.where('employeeId').equals(id).delete();
      await db.otherPayments.where('employeeId').equals(id).delete();
      await db.leaves.where('employeeId').equals(id).delete();
      await db.attachments.where('employeeId').equals(id).delete();
      
      if (onDelete) onDelete();
    }
  };

  if (!employee && !isEditing) return null;

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <h3 className="card-title">
          <User color="var(--primary-600)" />
          بيانات الموظف الأساسية وفترة التتبع
        </h3>

        {employee && !isEditing && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
              <Edit3 size={15} /> تعديل البيانات
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              <Trash2 size={15} /> حذف الموظف
            </button>
          </div>
        )}
      </div>

      {!isEditing && employee ? (
        <div className="grid-3" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>اسم الموظف:</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-900)' }}>{employee.name}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>المسمى الوظيفي:</div>
            <div style={{ fontWeight: 700 }}>{employee.jobTitle || 'مهندس مدني'}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>القسم / الإدارة:</div>
            <div style={{ fontWeight: 700 }}>{employee.department || 'الهندسة المدنية'}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>فترة تتبع الرواتب والمرفقات:</div>
            <div style={{ fontWeight: 700, color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={16} /> من {employee.startDate} حتى {employee.endDate}
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ملاحظات عامة:</div>
            <div style={{ fontSize: '0.875rem' }}>{employee.notes || 'لا توجد ملاحظات مدونة (يمكنك كتابتها بالضغط على تعديل البيانات)'}</div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">اسم الموظف الثلاثي *</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                placeholder="مثال: هاني مصطفي حافظ ابو عوض"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">المسمى الوظيفي</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="مهندس مدني"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">القسم / الإدارة</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="الهندسة المدنية"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">بداية فترة التتبع (شهر-سنة)</label>
              <input 
                type="month" 
                className="form-control" 
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">نهاية فترة التتبع (شهر-سنة)</label>
              <input 
                type="month" 
                className="form-control" 
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ملاحظات عامة (اكتبها هنا)</label>
            <textarea 
              className="form-control"
              rows={2}
              placeholder="اكتب ملاحظاتك الخاصة هنا..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            {employee && (
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                إلغاء
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> حفظ بيانات الموظف
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
