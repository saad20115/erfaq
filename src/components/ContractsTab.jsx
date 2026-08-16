import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { 
  FileText, Plus, Trash2, Edit3, Paperclip, 
  CheckCircle2, XCircle, MinusCircle, DollarSign, Calendar 
} from 'lucide-react';
import AttachmentManagerModal from './AttachmentManagerModal';

export default function ContractsTab({ employeeId }) {
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    contractNumber: '',
    startDate: '',
    endDate: '',
    value: '',
    notes: '',
    status: 'missing'
  });

  const contracts = useLiveQuery(
    () => db.contracts.where('employeeId').equals(employeeId).toArray(),
    [employeeId]
  ) || [];

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      contractNumber: `CNT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      startDate: `${new Date().getFullYear()}-01-01`,
      endDate: `${new Date().getFullYear() + 2}-12-31`,
      value: 120000,
      notes: '',
      status: 'missing'
    });
    setIsFormOpen(true);
  };

  const handleEdit = (cnt) => {
    setEditingId(cnt.id);
    setForm({
      contractNumber: cnt.contractNumber || '',
      startDate: cnt.startDate || '',
      endDate: cnt.endDate || '',
      value: cnt.value || '',
      notes: cnt.notes || '',
      status: cnt.status || 'missing'
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await db.contracts.update(editingId, {
        ...form,
        value: Number(form.value) || 0
      });
    } else {
      await db.contracts.add({
        employeeId,
        ...form,
        value: Number(form.value) || 0,
        createdAt: new Date().toISOString()
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل ترغب في حذف سجل العقد نهائياً؟')) {
      await db.contracts.delete(id);
      await db.attachments.where({ employeeId, category: 'contract', refId: id }).delete();
    }
  };

  const handleStatusChange = async (contractId, newStatus) => {
    await db.contracts.update(contractId, { status: newStatus });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <FileText color="var(--primary-600)" />
          سجل عقود العمل وتفاصيل المرفقات والقيمة
        </h3>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <Plus size={16} /> إضافة عقد جديد
        </button>
      </div>

      {/* Form Modal / Panel for Adding/Editing Contract */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', border: '1px solid var(--primary-100)' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary-900)' }}>
            {editingId ? 'تعديل بيانات العقد' : 'إضافة عقد جديد'}
          </h4>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">رقم العقد *</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                value={form.contractNumber}
                onChange={(e) => setForm({ ...form, contractNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">تاريخ بدء العقد</label>
              <input 
                type="date" 
                className="form-control" 
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">تاريخ نهاية العقد</label>
              <input 
                type="date" 
                className="form-control" 
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">إجمالي قيمة العقد (ريال)</label>
              <input 
                type="number" 
                className="form-control" 
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">حالة مرفق العقد</label>
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
            <label className="form-label">ملاحظات وشروط العقد</label>
            <textarea 
              className="form-control" 
              rows={2} 
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsFormOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary btn-sm">حفظ العقد</button>
          </div>
        </form>
      )}

      {/* Contracts Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>رقم العقد</th>
              <th>فترة العقد</th>
              <th>قيمة العقد</th>
              <th>حالة المرفق</th>
              <th>الملاحظات</th>
              <th>الإجراءات والمرفقات</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  لا توجد عقود مسجلة لهذا الموظف بعد. اضغط "إضافة عقد جديد" للبدء.
                </td>
              </tr>
            ) : (
              contracts.map((cnt, idx) => (
                <tr key={cnt.id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 700 }}>{cnt.contractNumber}</td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>
                      {cnt.startDate || '?'} إلى {cnt.endDate || '?'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                    {(Number(cnt.value) || 0).toLocaleString('ar-SA')} ريال
                  </td>
                  <td>
                    {cnt.status === 'attached' && <span className="status-badge attached"><CheckCircle2 size={14} /> تم الإرفاق ✅</span>}
                    {cnt.status === 'missing' && <span className="status-badge missing"><XCircle size={14} /> غير مرفق ❌</span>}
                    {cnt.status === 'na' && <span className="status-badge na"><MinusCircle size={14} /> لا يتطلب 🚫</span>}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '250px' }}>
                    {cnt.notes || '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setActiveModalItem(cnt)}
                        title="إدارة مرفقات العقد (صورة/PDF/لقطة شاشة)"
                      >
                        <Paperclip size={15} /> المرفقات
                      </button>

                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(cnt)}
                        title="تعديل"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(cnt.id)}
                        title="حذف"
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

      {/* Attachment Manager Modal */}
      {activeModalItem && (
        <AttachmentManagerModal
          isOpen={true}
          onClose={() => setActiveModalItem(null)}
          employeeId={employeeId}
          category="contract"
          refId={activeModalItem.id}
          title={`مرفقات العقد رقم: ${activeModalItem.contractNumber}`}
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
