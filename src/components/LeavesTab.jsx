import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { 
  Calendar, Plus, Trash2, Edit3, Paperclip, 
  CheckCircle2, XCircle, MinusCircle, UserCheck 
} from 'lucide-react';
import AttachmentManagerModal from './AttachmentManagerModal';

export default function LeavesTab({ employeeId }) {
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    leaveType: 'إجازة سنوية',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    daysCount: 5,
    deductionOrPay: 0,
    notes: '',
    status: 'missing'
  });

  const leaves = useLiveQuery(
    () => db.leaves.where('employeeId').equals(employeeId).toArray(),
    [employeeId]
  ) || [];

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      leaveType: 'إجازة سنوية',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      daysCount: 5,
      deductionOrPay: 0,
      notes: '',
      status: 'missing'
    });
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      leaveType: item.leaveType || 'إجازة سنوية',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      daysCount: item.daysCount || 0,
      deductionOrPay: item.deductionOrPay || 0,
      notes: item.notes || '',
      status: item.status || 'missing'
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await db.leaves.update(editingId, {
        ...form,
        daysCount: Number(form.daysCount) || 0,
        deductionOrPay: Number(form.deductionOrPay) || 0
      });
    } else {
      await db.leaves.add({
        employeeId,
        ...form,
        daysCount: Number(form.daysCount) || 0,
        deductionOrPay: Number(form.deductionOrPay) || 0,
        createdAt: new Date().toISOString()
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل ترغب في حذف سجل الإجازة؟')) {
      await db.leaves.delete(id);
      await db.attachments.where({ employeeId, category: 'leave', refId: id }).delete();
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    await db.leaves.update(id, { status: newStatus });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <Calendar color="var(--primary-600)" />
          رصيد الإجازات المستخدم وإثباتات القرارات والصرف
        </h3>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <Plus size={16} /> إضافة إجازة جديدة
        </button>
      </div>

      {/* Form Panel */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', border: '1px solid var(--primary-100)' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
            {editingId ? 'تعديل الإجازة' : 'تسجيل إجازة جديدة'}
          </h4>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">نوع الإجازة *</label>
              <select 
                className="form-control"
                value={form.leaveType}
                onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              >
                <option value="إجازة سنوية">إجازة سنوية (اعتيادية) 🏖️</option>
                <option value="إجازة مرضية">إجازة مرَضية 🏥</option>
                <option value="إجازة اضطرارية">إجازة اضطرارية ⚡</option>
                <option value="إجازة بدون راتب">إجازة بدون راتب 🚫</option>
                <option value="إجازة أداء مناسك الحج">إجازة حج / عمرة 🕋</option>
                <option value="إجازة أخرى">إجازة أخرى 📝</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">تاريخ البداية</label>
              <input 
                type="date" 
                className="form-control" 
                required 
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">تاريخ النهاية</label>
              <input 
                type="date" 
                className="form-control" 
                required 
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">عدد الأيام المستفادة</label>
              <input 
                type="number" 
                className="form-control" 
                required
                value={form.daysCount}
                onChange={(e) => setForm({ ...form, daysCount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">المبلغ المخصوم / البدل المصروف (إن وجد)</label>
              <input 
                type="number" 
                className="form-control" 
                value={form.deductionOrPay}
                onChange={(e) => setForm({ ...form, deductionOrPay: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">حالة إثبات القرار/الصرف</label>
              <select 
                className="form-control"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="attached">تم الإرفاق ✅</option>
                <option value="missing">غير مرفق ❌</option>
                <option value="na">لا يتطلب 🚫</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ملاحظات عن الإجازة</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="مثال: تم اعتماد التقرير الطبي من المستشفى"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsFormOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary btn-sm">حفظ الإجازة</button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>نوع الإجازة</th>
              <th>فترة الإجازة</th>
              <th>عدد الأيام</th>
              <th>المستحق / الخصم</th>
              <th>إثبات القرار/الصرف</th>
              <th>الملاحظات</th>
              <th>الإجراءات والمرفقات</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  لا توجد إجازات مسجلة لهذا الموظف بعد.
                </td>
              </tr>
            ) : (
              leaves.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 700 }}>{item.leaveType}</td>
                  <td>{item.startDate} إلى {item.endDate}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{item.daysCount} يوم</td>
                  <td>
                    {item.deductionOrPay !== 0 ? `${(Number(item.deductionOrPay) || 0).toLocaleString('ar-SA')} ريال` : 'بدون تأثير مالي'}
                  </td>
                  <td>
                    {item.status === 'attached' && <span className="status-badge attached"><CheckCircle2 size={14} /> تم الإرفاق ✅</span>}
                    {item.status === 'missing' && <span className="status-badge missing"><XCircle size={14} /> غير مرفق ❌</span>}
                    {item.status === 'na' && <span className="status-badge na"><MinusCircle size={14} /> لا يتطلب 🚫</span>}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.notes || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        className={`btn btn-sm ${item.status === 'attached' ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => setActiveModalItem(item)}
                        title="إرفاق/معاينة قرار وإثبات الإجازة"
                      >
                        <Paperclip size={15} /> قرار/إثبات الإجازة
                      </button>

                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item)}>
                        <Edit3 size={15} />
                      </button>

                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Attachment Modal */}
      {activeModalItem && (
        <AttachmentManagerModal
          isOpen={true}
          onClose={() => setActiveModalItem(null)}
          employeeId={employeeId}
          category="leave"
          refId={activeModalItem.id}
          title={`إثبات ${activeModalItem.leaveType}: ${activeModalItem.daysCount} أيام من ${activeModalItem.startDate}`}
          currentStatus={activeModalItem.status}
          onStatusChange={(newStatus) => {
            handleStatusChange(activeModalItem.id, newStatus);
            setActiveModalItem(prev => prev ? { ...prev, status: newStatus } : null);
          }}
        />
      )}
    </div>
  );
}
