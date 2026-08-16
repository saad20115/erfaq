import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { 
  DollarSign, Plus, Trash2, Edit3, Paperclip, 
  CheckCircle2, XCircle, MinusCircle 
} from 'lucide-react';
import AttachmentManagerModal from './AttachmentManagerModal';

export default function OtherPaymentsTab({ employeeId }) {
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: 500,
    status: 'missing'
  });

  const otherPayments = useLiveQuery(
    () => db.otherPayments.where('employeeId').equals(employeeId).toArray(),
    [employeeId]
  ) || [];

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      description: '',
      amount: 500,
      status: 'missing'
    });
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      date: item.date || '',
      description: item.description || '',
      amount: item.amount || 0,
      status: item.status || 'missing'
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await db.otherPayments.update(editingId, {
        ...form,
        amount: Number(form.amount) || 0
      });
    } else {
      await db.otherPayments.add({
        employeeId,
        ...form,
        amount: Number(form.amount) || 0,
        createdAt: new Date().toISOString()
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل ترغب في حذف هذا البند المالي؟')) {
      await db.otherPayments.delete(id);
      await db.attachments.where({ employeeId, category: 'other', refId: id }).delete();
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    await db.otherPayments.update(id, { status: newStatus });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <DollarSign color="var(--primary-600)" />
          سجل المستحقات والمصروفات الأخرى وإثباتات الصرف
        </h3>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <Plus size={16} /> إضافة بند مصروفات آخر
        </button>
      </div>

      {/* Form Panel */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', border: '1px solid var(--primary-100)' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
            {editingId ? 'تعديل بند المصروفات' : 'إضافة بند مصروفات جديد'}
          </h4>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">التاريخ *</label>
              <input 
                type="date" 
                className="form-control" 
                required 
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">المبلغ (ريال) *</label>
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
            <label className="form-label">تفاصيل وبيان المصروف</label>
            <input 
              type="text" 
              className="form-control" 
              required
              placeholder="مثال: بدل سفرية عمل، تعويض عن مصاريف دورة تدريبية"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsFormOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary btn-sm">حفظ البند</button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>التاريخ</th>
              <th>البيان والتفاصيل</th>
              <th>المبلغ المصروف</th>
              <th>إثبات الصرف</th>
              <th>الإجراءات والمرفقات</th>
            </tr>
          </thead>
          <tbody>
            {otherPayments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  لا توجد مصروفات أو مستحقات أخرى مسجلة حالياً.
                </td>
              </tr>
            ) : (
              otherPayments.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.date}</td>
                  <td style={{ fontWeight: 600 }}>{item.description}</td>
                  <td style={{ fontWeight: 800, color: 'var(--primary-800)' }}>
                    {(Number(item.amount) || 0).toLocaleString('ar-SA')} ريال
                  </td>
                  <td>
                    {item.status === 'attached' && <span className="status-badge attached"><CheckCircle2 size={14} /> تم الإرفاق ✅</span>}
                    {item.status === 'missing' && <span className="status-badge missing"><XCircle size={14} /> غير مرفق ❌</span>}
                    {item.status === 'na' && <span className="status-badge na"><MinusCircle size={14} /> لا يتطلب 🚫</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        className={`btn btn-sm ${item.status === 'attached' ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => setActiveModalItem(item)}
                        title="إرفاق/معاينة إثبات الصرف"
                      >
                        <Paperclip size={15} /> إثبات الصرف
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
          category="other"
          refId={activeModalItem.id}
          title={`إثبات صرف: ${activeModalItem.description} (${activeModalItem.amount} ريال)`}
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
