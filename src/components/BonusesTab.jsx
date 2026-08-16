import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { 
  Award, Plus, Trash2, Edit3, Paperclip, 
  CheckCircle2, XCircle, MinusCircle, Clock 
} from 'lucide-react';
import AttachmentManagerModal from './AttachmentManagerModal';

export default function BonusesTab({ employeeId }) {
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    type: 'bonus', // 'bonus' or 'overtime'
    date: new Date().toISOString().slice(0, 10),
    amount: 1000,
    description: '',
    status: 'missing'
  });

  const bonuses = useLiveQuery(
    () => db.bonuses.where('employeeId').equals(employeeId).toArray(),
    [employeeId]
  ) || [];

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      type: 'bonus',
      date: new Date().toISOString().slice(0, 10),
      amount: 2000,
      description: '',
      status: 'missing'
    });
    setIsFormOpen(true);
  };

  const handleEdit = (b) => {
    setEditingId(b.id);
    setForm({
      type: b.type || 'bonus',
      date: b.date || '',
      amount: b.amount || 0,
      description: b.description || '',
      status: b.status || 'missing'
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await db.bonuses.update(editingId, {
        ...form,
        amount: Number(form.amount) || 0
      });
    } else {
      await db.bonuses.add({
        employeeId,
        ...form,
        amount: Number(form.amount) || 0,
        createdAt: new Date().toISOString()
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل ترغب في حذف هذا البند نهائياً؟')) {
      await db.bonuses.delete(id);
      await db.attachments.where({ employeeId, category: 'bonus', refId: id }).delete();
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    await db.bonuses.update(id, { status: newStatus });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <Award color="var(--primary-600)" />
          سجل المكافآت والعمل الإضافي وإثباتات الصرف
        </h3>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <Plus size={16} /> إضافة مكافأة / إضافي
        </button>
      </div>

      {/* Form Panel */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', border: '1px solid var(--primary-100)' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
            {editingId ? 'تعديل سجل المكافأة / الإضافي' : 'إضافة مكافأة أو إضافي جديد'}
          </h4>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">نوع البند</label>
              <select 
                className="form-control"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="bonus">مكافأة تميز / أداء 🎁</option>
                <option value="overtime">عمل إضافي (Overtime) ⏰</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">تاريخ الاستحقاق / الصرف</label>
              <input 
                type="date" 
                className="form-control" 
                required 
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">المبلغ المصروف (ريال)</label>
              <input 
                type="number" 
                className="form-control" 
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">حالة إثبات الصرف</label>
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
            <label className="form-label">الوصف / سبب الصرف</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="مثال: بدل إنجاز مشروع التحديث السنوي"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsFormOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary btn-sm">حفظ</button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>النوع</th>
              <th>التاريخ</th>
              <th>المبلغ المصروف</th>
              <th>الوصف / البيان</th>
              <th>إثبات الصرف</th>
              <th>الإجراءات والمرفقات</th>
            </tr>
          </thead>
          <tbody>
            {bonuses.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  لا توجد مكافآت أو ساعات إضافية مسجلة بعد.
                </td>
              </tr>
            ) : (
              bonuses.map((b, idx) => (
                <tr key={b.id}>
                  <td>{idx + 1}</td>
                  <td>
                    {b.type === 'bonus' ? (
                      <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>🎁 مكافأة</span>
                    ) : (
                      <span style={{ fontWeight: 700, color: '#d97706' }}>⏰ عمل إضافي</span>
                    )}
                  </td>
                  <td>{b.date}</td>
                  <td style={{ fontWeight: 800, color: 'var(--primary-800)' }}>
                    {(Number(b.amount) || 0).toLocaleString('ar-SA')} ريال
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{b.description || '-'}</td>
                  <td>
                    {b.status === 'attached' && <span className="status-badge attached"><CheckCircle2 size={14} /> تم الإرفاق ✅</span>}
                    {b.status === 'missing' && <span className="status-badge missing"><XCircle size={14} /> غير مرفق ❌</span>}
                    {b.status === 'na' && <span className="status-badge na"><MinusCircle size={14} /> لا يتطلب 🚫</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        className={`btn btn-sm ${b.status === 'attached' ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => setActiveModalItem(b)}
                        title="إرفاق/معاينة إثبات الصرف"
                      >
                        <Paperclip size={15} /> إثبات الصرف
                      </button>

                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(b)}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(b.id)}
                      >
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
          category="bonus"
          refId={activeModalItem.id}
          title={`إثبات صرف ${activeModalItem.type === 'bonus' ? 'المكافأة' : 'العمل الإضافي'}: ${activeModalItem.amount} ريال بتاريخ ${activeModalItem.date}`}
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
