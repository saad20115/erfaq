import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureMonthlySalaryRecords, pushToServer } from '../db/database';
import { 
  Calendar, CheckCircle2, XCircle, MinusCircle, 
  Paperclip, Filter, Edit3, DollarSign, Search, Sparkles,
  Upload, Eye, Download, Trash2, FileText, AlertCircle, Image,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import AttachmentManagerModal from './AttachmentManagerModal';
import FullscreenViewerModal from './FullscreenViewerModal';

export default function SalariesTab({ employee }) {
  const employeeId = employee?.id;
  const [activeModalSalary, setActiveModalSalary] = useState(null);
  const [paidLeaveModalSalary, setPaidLeaveModalSalary] = useState(null);
  const [selectedSalaryForPanel, setSelectedSalaryForPanel] = useState(null);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [fullscreenAttachment, setFullscreenAttachment] = useState(null);

  // Column Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'yearMonth', direction: 'asc' });

  // Notes Modal Editing State
  const [editingNotesSalary, setEditingNotesSalary] = useState(null);
  const [notesText, setNotesText] = useState('');

  const [paidLeaveForm, setPaidLeaveForm] = useState({
    leaveType: 'إجازة سنوية (اعتيادية)',
    daysCount: 15,
    notes: '',
    status: 'attached'
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchMonth, setSearchMonth] = useState('');
  const [editingSalaryId, setEditingSalaryId] = useState(null);

  const [editForm, setEditForm] = useState({
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    notes: '',
    status: 'missing'
  });

  // Fetch salaries reactively sorted by yearMonth
  const salaries = useLiveQuery(
    () => db.salaries.where('employeeId').equals(employeeId).sortBy('yearMonth'),
    [employeeId]
  ) || [];

  // Fetch leaves reactively to sync paid leave months
  const leaves = useLiveQuery(
    () => db.leaves.where('employeeId').equals(employeeId).toArray(),
    [employeeId]
  ) || [];

  // Automatically select first salary month for side panel if none selected
  useEffect(() => {
    if (salaries.length > 0 && !selectedSalaryForPanel) {
      setSelectedSalaryForPanel(salaries[0]);
    }

    // Clean up December 2024 auto attachment if present
    const dec2024 = salaries.find(s => s.yearMonth === '2024-12');
    if (dec2024 && employeeId) {
      db.attachments.where({ employeeId, category: 'salary', refId: dec2024.id }).toArray().then(async (atts) => {
        for (const att of atts) {
          if (att.fileName === 'إثبات_صرف_راتب_ديسمبر_2024.png' || att.fileData === '/dec_2024_statement.png') {
            await db.attachments.delete(att.id);
          }
        }
        const remaining = atts.filter(a => a.fileName !== 'إثبات_صرف_راتب_ديسمبر_2024.png' && a.fileData !== '/dec_2024_statement.png');
        if (remaining.length === 0 && dec2024.status === 'attached') {
          await db.salaries.update(dec2024.id, { status: 'missing' });
        }
      });
    }
  }, [salaries, selectedSalaryForPanel, employeeId]);

  // Reactive attachments query for the selected month in side panel
  const currentMonthAttachments = useLiveQuery(
    () => {
      if (!selectedSalaryForPanel) return [];
      return db.attachments.where({
        employeeId,
        category: 'salary',
        refId: selectedSalaryForPanel.id
      }).toArray();
    },
    [employeeId, selectedSalaryForPanel?.id]
  ) || [];

  // Listen for Clipboard Paste (Ctrl+V) for side panel
  useEffect(() => {
    if (!selectedSalaryForPanel) return;

    const handlePaste = async (e) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (const item of clipboardItems) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const fileName = `لقطة_شاشة_${selectedSalaryForPanel.yearMonth}_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.png`;
            const reader = new FileReader();
            reader.onload = async () => {
              await db.attachments.add({
                employeeId,
                category: 'salary',
                refId: selectedSalaryForPanel.id,
                fileName,
                fileType: 'image/png',
                fileSize: blob.size,
                fileData: reader.result,
                uploadDate: new Date().toISOString()
              });
              
              if (selectedSalaryForPanel.status === 'missing') {
                await db.salaries.update(selectedSalaryForPanel.id, { status: 'attached' });
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedSalaryForPanel, employeeId]);

  // Handle Side Panel File Upload
  const handleSidePanelFileUpload = async (e) => {
    if (!selectedSalaryForPanel) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async () => {
        await db.attachments.add({
          employeeId,
          category: 'salary',
          refId: selectedSalaryForPanel.id,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileData: reader.result,
          uploadDate: new Date().toISOString()
        });

        if (selectedSalaryForPanel.status === 'missing') {
          await db.salaries.update(selectedSalaryForPanel.id, { status: 'attached' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Paid Leave Toggle Click
  const handleTogglePaidLeaveClick = async (salaryRecord) => {
    if (salaryRecord.isPaidLeave) {
      await db.salaries.update(salaryRecord.id, { isPaidLeave: false });
      const linkedLeaves = await db.leaves.where('employeeId').equals(employeeId).toArray();
      const match = linkedLeaves.find(l => l.startDate && l.startDate.startsWith(salaryRecord.yearMonth));
      if (match) {
        await db.leaves.delete(match.id);
      }
    } else {
      setPaidLeaveModalSalary(salaryRecord);
      setPaidLeaveForm({
        leaveType: salaryRecord.paidLeaveType || 'إجازة سنوية (اعتيادية)',
        daysCount: salaryRecord.paidLeaveDays || 15,
        notes: salaryRecord.paidLeaveNotes || `إجازة مدفوعة لشهر ${salaryRecord.yearMonth}`,
        status: 'attached'
      });
    }
  };

  // Save Paid Leave Details from Modal
  const handleSavePaidLeaveDetails = async (e) => {
    e.preventDefault();
    if (!paidLeaveModalSalary) return;

    const s = paidLeaveModalSalary;
    const days = Number(paidLeaveForm.daysCount) || 1;

    await db.salaries.update(s.id, {
      isPaidLeave: true,
      paidLeaveType: paidLeaveForm.leaveType,
      paidLeaveDays: days,
      paidLeaveNotes: paidLeaveForm.notes
    });

    const linkedLeaves = await db.leaves.where('employeeId').equals(employeeId).toArray();
    const existingLeave = linkedLeaves.find(l => l.startDate && l.startDate.startsWith(s.yearMonth));

    if (existingLeave) {
      await db.leaves.update(existingLeave.id, {
        leaveType: paidLeaveForm.leaveType,
        daysCount: days,
        notes: paidLeaveForm.notes,
        status: paidLeaveForm.status
      });
    } else {
      await db.leaves.add({
        employeeId,
        leaveType: paidLeaveForm.leaveType,
        startDate: `${s.yearMonth}-01`,
        endDate: `${s.yearMonth}-${String(Math.min(days, 28)).padStart(2, '0')}`,
        daysCount: days,
        deductionOrPay: 0,
        notes: paidLeaveForm.notes,
        status: paidLeaveForm.status,
        createdAt: new Date().toISOString()
      });
    }

    setPaidLeaveModalSalary(null);
  };

  // Row Edit Handlers
  const handleStartRowEdit = (s) => {
    setEditingSalaryId(s.id);
    setEditForm({
      basicSalary: s.basicSalary !== undefined ? s.basicSalary : 15000,
      carAllowance: s.carAllowance !== undefined ? s.carAllowance : 1500,
      phoneAllowance: s.phoneAllowance !== undefined ? s.phoneAllowance : 375,
      bonusesOrOvertime: s.bonusesOrOvertime !== undefined ? s.bonusesOrOvertime : 0,
      deductions: s.deductions !== undefined ? s.deductions : 0,
      status: s.status || 'missing',
      notes: s.notes || ''
    });
  };

  const handleSaveRowEdit = async (salaryId) => {
    const basic = Number(editForm.basicSalary) || 0;
    const car = Number(editForm.carAllowance) || 0;
    const phone = Number(editForm.phoneAllowance) || 0;
    const bonus = Number(editForm.bonusesOrOvertime) || 0;
    const ded = (car === 0 && phone === 0) ? 0 : (Number(editForm.deductions) || 0);
    const net = basic + car + phone + bonus - ded;

    await db.salaries.update(salaryId, {
      basicSalary: basic,
      carAllowance: car,
      phoneAllowance: phone,
      bonusesOrOvertime: bonus,
      deductions: ded,
      netSalary: net,
      status: editForm.status,
      notes: editForm.notes,
      updatedAt: new Date().toISOString()
    });

    const targetSalary = salaries.find(s => s.id === salaryId);
    if (targetSalary) {
      const existingBonuses = await db.bonuses.where({ employeeId, month: targetSalary.yearMonth }).toArray();
      if (bonus > 0) {
        if (existingBonuses.length > 0) {
          await db.bonuses.update(existingBonuses[0].id, { amount: bonus });
        } else {
          await db.bonuses.add({
            employeeId,
            type: 'مكافأة / إضافي شهري',
            amount: bonus,
            month: targetSalary.yearMonth,
            notes: `إضافي/مكافأة شهر ${targetSalary.yearMonth}`,
            status: 'attached',
            createdAt: new Date().toISOString()
          });
        }
      } else if (existingBonuses.length > 0) {
        await db.bonuses.delete(existingBonuses[0].id);
      }
    }

    if (selectedSalaryForPanel?.id === salaryId) {
      setSelectedSalaryForPanel(prev => prev ? {
        ...prev,
        basicSalary: basic,
        carAllowance: car,
        phoneAllowance: phone,
        bonusesOrOvertime: bonus,
        deductions: ded,
        netSalary: net,
        status: editForm.status,
        notes: editForm.notes
      } : null);
    }

    await pushToServer();
    setEditingSalaryId(null);
  };

  // Handle Column Header Sorting Click
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter salaries
  const filteredSalaries = salaries.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (searchMonth && !s.yearMonth.includes(searchMonth)) return false;
    return true;
  });

  // Sort filtered salaries
  const sortedSalaries = [...filteredSalaries].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    if (sortConfig.key === 'carAllowance') {
      valA = valA !== undefined ? valA : 1500;
      valB = valB !== undefined ? valB : 1500;
    } else if (sortConfig.key === 'phoneAllowance') {
      valA = valA !== undefined ? valA : 375;
      valB = valB !== undefined ? valB : 375;
    } else if (sortConfig.key === 'grossTotal') {
      valA = (Number(a.basicSalary) || 15000) + (a.carAllowance !== undefined ? Number(a.carAllowance) : 1500) + (a.phoneAllowance !== undefined ? Number(a.phoneAllowance) : 375);
      valB = (Number(b.basicSalary) || 15000) + (b.carAllowance !== undefined ? Number(b.carAllowance) : 1500) + (b.phoneAllowance !== undefined ? Number(b.phoneAllowance) : 375);
    } else if (sortConfig.key === 'isPaidLeave') {
      valA = valA ? 1 : 0;
      valB = valB ? 1 : 0;
    } else if (sortConfig.key === 'basicSalary') {
      valA = Number(valA) || 15000;
      valB = Number(valB) || 15000;
    } else if (sortConfig.key === 'netSalary') {
      valA = Number(valA) || 16875;
      valB = Number(valB) || 16875;
    } else if (sortConfig.key === 'bonusesOrOvertime') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    }

    if (typeof valA === 'string') {
      return sortConfig.direction === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    }

    return sortConfig.direction === 'asc' 
      ? valA - valB 
      : valB - valA;
  });

  // Helper to render interactive sortable th header
  const renderSortableTh = (label, key) => {
    const isActive = sortConfig.key === key;
    return (
      <th 
        onClick={() => handleSort(key)} 
        style={{ 
          cursor: 'pointer', 
          userSelect: 'none', 
          backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'inherit',
          transition: 'background-color 0.15s ease'
        }}
        title={`اضغط للترتيب حسب (${label})`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'space-between' }}>
          <span>{label}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {isActive ? (
              sortConfig.direction === 'asc' 
                ? <ArrowUp size={14} color="var(--primary-600)" /> 
                : <ArrowDown size={14} color="var(--primary-600)" />
            ) : (
              <ArrowUpDown size={13} color="var(--text-muted)" style={{ opacity: 0.4 }} />
            )}
          </span>
        </div>
      </th>
    );
  };

  const handleOpenEdit = (salary) => {
    setEditingSalaryId(salary.id);
    setEditForm({
      basicSalary: salary.basicSalary || 15000,
      allowances: salary.allowances || 1875,
      deductions: salary.deductions || 0,
      notes: salary.notes || '',
      status: salary.status || 'missing'
    });
  };

  const handleSaveEdit = async (id) => {
    const net = (Number(editForm.basicSalary) || 15000) + 1875 - (Number(editForm.deductions) || 0);
    await db.salaries.update(id, {
      ...editForm,
      basicSalary: Number(editForm.basicSalary) || 15000,
      allowances: 1875,
      deductions: Number(editForm.deductions) || 0,
      netSalary: net,
      updatedAt: new Date().toISOString()
    });
    setEditingSalaryId(null);
  };

  // Fetch all salary attachments reactively to compute automatic status
  const allSalaryAttachments = useLiveQuery(
    () => db.attachments.where({ employeeId, category: 'salary' }).toArray(),
    [employeeId]
  ) || [];

  // Automatic Status Evaluation Effect:
  // If status is not 'na', automatically update status to 'attached' if files exist or 'missing' if 0 files
  useEffect(() => {
    if (!salaries || salaries.length === 0) return;
    salaries.forEach(async (s) => {
      if (s.status === 'na') return; // 'na' is manual only
      const hasFiles = allSalaryAttachments.some(att => att.refId === s.id);
      const autoStatus = hasFiles ? 'attached' : 'missing';
      if (s.status !== autoStatus) {
        await db.salaries.update(s.id, { status: autoStatus });
      }
    });
  }, [salaries, allSalaryAttachments]);

  // Handle direct toggle: user can ONLY manually toggle 'na' (لا يتطلب 🚫)
  const handleDirectStatusToggle = async (salaryId, currentStatus) => {
    const hasFiles = allSalaryAttachments.some(att => att.refId === salaryId);
    let newStatus;
    if (currentStatus === 'na') {
      // Revert back to automatic evaluation
      newStatus = hasFiles ? 'attached' : 'missing';
    } else {
      // Manually set to 'na' (لا يتطلب 🚫)
      newStatus = 'na';
    }
    await db.salaries.update(salaryId, { status: newStatus });
  };

  const handleGenerateMonths = async () => {
    if (!employee) return;
    await ensureMonthlySalaryRecords(
      employee.id, 
      employee.startDate || '2020-01', 
      employee.endDate || '2025-01', 
      15000
    );
  };

  // Quick summary counts
  const totalAttached = salaries.filter(s => s.status === 'attached').length;
  const totalMissing = salaries.filter(s => s.status === 'missing').length;
  const totalNA = salaries.filter(s => s.status === 'na').length;
  const totalNetSum = salaries.reduce((acc, s) => acc + (Number(s.netSalary) || 16875), 0);

  return (
    <div>
      {/* Top Summary KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card" style={{ borderColor: '#e2e8f0' }}>
          <div className="stat-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{salaries.length}</div>
            <div className="stat-label">إجمالي الأشهر المسجلة</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#a7f3d0' }}>
          <div className="stat-icon" style={{ background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#065f46' }}>{totalAttached}</div>
            <div className="stat-label">تم إرفاق إثبات الصرف ✅</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#fecaca' }}>
          <div className="stat-icon" style={{ background: 'var(--accent-rose-light)', color: 'var(--accent-rose)' }}>
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#991b1b' }}>{totalMissing}</div>
            <div className="stat-label">إثباتات مفقودة ❌</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#e2e8f0' }}>
          <div className="stat-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalNetSum.toLocaleString('ar-SA')} ﷼</div>
            <div className="stat-label">إجمالي الصافي المصروف</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', background: '#ffffff', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>تصفية حسب الحالة:</span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterStatus('all')}>
              الكل ({salaries.length})
            </button>
            <button className={`btn btn-sm ${filterStatus === 'missing' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setFilterStatus('missing')}>
              غير مرفق ❌ ({totalMissing})
            </button>
            <button className={`btn btn-sm ${filterStatus === 'attached' ? 'btn-success' : 'btn-secondary'}`} onClick={() => setFilterStatus('attached')}>
              تم الإرفاق ✅ ({totalAttached})
            </button>
            <button className={`btn btn-sm ${filterStatus === 'na' ? 'btn-secondary' : 'btn-secondary'}`} onClick={() => setFilterStatus('na')}>
              لا يتطلب 🚫 ({totalNA})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: 'auto' }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="بحث بالسنة أو الشهر (مثال: 2024-05)"
            value={searchMonth}
            onChange={(e) => setSearchMonth(e.target.value)}
            className="form-control"
            style={{ width: '220px', padding: '0.35rem 0.65rem' }}
          />
        </div>
      </div>

      {/* SPLIT SCREEN LAYOUT: Right Table (1fr) + Left Attachment Preview Panel (440px) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* RIGHT SIDE: Salaries Table aligned to the Right */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title">
              <Calendar color="var(--primary-600)" />
              جدول الرواتب الشهرية ({employee?.startDate || '2020-01'} إلى {employee?.endDate || '2025-01'})
            </h3>

            <button className="btn btn-secondary btn-sm" onClick={handleGenerateMonths}>
              <Sparkles size={15} /> تحديث الأشهر
            </button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  {renderSortableTh('الشهر والسنة 📅', 'yearMonth')}
                  {renderSortableTh('الراتب الأساسي 💰', 'basicSalary')}
                  {renderSortableTh('بدل سيارة 🚗', 'carAllowance')}
                  {renderSortableTh('بدل اتصال 📞', 'phoneAllowance')}
                  {renderSortableTh('إجمالي الراتب والبدلات 📊', 'grossTotal')}
                  {renderSortableTh('الإضافي / المكافآت 🎁', 'bonusesOrOvertime')}
                  {renderSortableTh('الصافي المستحق 💵', 'netSalary')}
                  {renderSortableTh('إجازة مدفوعة 🏖️', 'isPaidLeave')}
                  {renderSortableTh('حالة الإرفاق 📎', 'status')}
                  <th>الملاحظات والتعديل</th>
                </tr>
              </thead>
              <tbody>
                {sortedSalaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      لا توجد سجلات رواتب مطابقة للتصفية الحالية.
                    </td>
                  </tr>
                ) : (
                  sortedSalaries.map((s) => {
                    const isEditing = editingSalaryId === s.id;
                    const isSelected = selectedSalaryForPanel?.id === s.id;
                    const [yr, mo] = s.yearMonth.split('-');
                    const monthNameArabic = new Date(Number(yr), Number(mo) - 1, 1).toLocaleString('ar-SA', { month: 'long' });

                    const carAtt = s.carAllowance !== undefined ? Number(s.carAllowance) : 1500;
                    const phoneAtt = s.phoneAllowance !== undefined ? Number(s.phoneAllowance) : 375;
                    const bonusAtt = Number(s.bonusesOrOvertime) || 0;
                    const basicAtt = Number(s.basicSalary) !== undefined ? Number(s.basicSalary) : 15000;
                    const grossTotal = basicAtt + carAtt + phoneAtt;
                    // If allowances are zero and basic is entered as exact net amount (e.g. 12367.67), deductions should not be subtracted again
                    const dedAtt = (carAtt === 0 && phoneAtt === 0) ? 0 : (Number(s.deductions) || 0);
                    const computedNet = basicAtt + carAtt + phoneAtt + bonusAtt - dedAtt;
                    const isPaid = s.isPaidLeave === true;

                    // Live Net & Gross calculations in Edit Mode
                    const editBasic = Number(editForm.basicSalary) || 0;
                    const editCar = Number(editForm.carAllowance) || 0;
                    const editPhone = Number(editForm.phoneAllowance) || 0;
                    const editBonus = Number(editForm.bonusesOrOvertime) || 0;
                    const editGross = editBasic + editCar + editPhone;
                    const editDed = (editCar === 0 && editPhone === 0) ? 0 : (Number(editForm.deductions) || 0);
                    const editNet = editBasic + editCar + editPhone + editBonus - editDed;

                    return (
                      <tr 
                        key={s.id} 
                        onClick={() => {
                          setSelectedSalaryForPanel(s);
                          setPreviewAttachment(null);
                        }}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#eff6ff' : (isPaid ? 'rgba(14, 165, 233, 0.05)' : (s.status === 'missing' ? 'rgba(239, 68, 68, 0.02)' : 'inherit')),
                          borderRight: isSelected ? '4px solid var(--primary-600)' : 'none',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ fontWeight: 800 }}>
                          <div style={{ color: 'var(--primary-900)' }}>{s.yearMonth}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{monthNameArabic} {yr}</div>
                        </td>

                        {isEditing ? (
                          <>
                            <td>
                              <input 
                                type="number" 
                                className="form-control" 
                                style={{ width: '85px', padding: '0.2rem 0.35rem', fontSize: '0.85rem' }}
                                value={editForm.basicSalary} 
                                onChange={(e) => setEditForm({ ...editForm, basicSalary: e.target.value })} 
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                className="form-control" 
                                style={{ width: '75px', padding: '0.2rem 0.35rem', fontSize: '0.85rem' }}
                                value={editForm.carAllowance} 
                                onChange={(e) => setEditForm({ ...editForm, carAllowance: e.target.value })} 
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                className="form-control" 
                                style={{ width: '75px', padding: '0.2rem 0.35rem', fontSize: '0.85rem' }}
                                value={editForm.phoneAllowance} 
                                onChange={(e) => setEditForm({ ...editForm, phoneAllowance: e.target.value })} 
                              />
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--primary-900)', fontSize: '0.85rem', backgroundColor: '#f8fafc' }}>
                              {editGross.toLocaleString('ar-SA')} ﷼
                            </td>
                            <td>
                              <input 
                                type="number" 
                                className="form-control" 
                                style={{ width: '80px', padding: '0.2rem 0.35rem', fontSize: '0.85rem' }}
                                value={editForm.bonusesOrOvertime} 
                                onChange={(e) => setEditForm({ ...editForm, bonusesOrOvertime: e.target.value })} 
                              />
                            </td>
                            <td style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '0.9rem' }}>
                              {editNet.toLocaleString('ar-SA')} ﷼
                            </td>
                            <td>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePaidLeaveClick(s);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              >
                                {isPaid ? (
                                  <span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' }}>
                                    نعم ✅
                                  </span>
                                ) : (
                                  <span className="status-badge na">لا ➖</span>
                                )}
                              </button>
                            </td>
                            <td>
                              <select 
                                className="form-control" 
                                style={{ padding: '0.2rem 0.35rem', fontSize: '0.8rem' }}
                                value={editForm.status} 
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              >
                                <option value="attached">تم الإرفاق ✅</option>
                                <option value="missing">غير مرفق ❌</option>
                                <option value="na">لا يتطلب 🚫</option>
                              </select>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '170px' }}>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}
                                  placeholder="اكتب الملاحظة..."
                                  value={editForm.notes} 
                                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} 
                                />
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <button className="btn btn-success btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); handleSaveRowEdit(s.id); }}>حفظ 💾</button>
                                  <button className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); setEditingSalaryId(null); }}>إلغاء ❌</button>
                                </div>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{basicAtt.toLocaleString('ar-SA')} ﷼</td>
                            <td style={{ color: '#059669', fontWeight: 600 }}>{carAtt.toLocaleString('ar-SA')} ﷼</td>
                            <td style={{ color: '#059669', fontWeight: 600 }}>{phoneAtt.toLocaleString('ar-SA')} ﷼</td>
                            <td style={{ fontWeight: 700, color: 'var(--primary-900)', fontSize: '0.85rem', backgroundColor: '#f8fafc' }}>
                              {grossTotal.toLocaleString('ar-SA')} ﷼
                            </td>
                            <td style={{ color: bonusAtt > 0 ? '#059669' : 'inherit', fontWeight: bonusAtt > 0 ? 700 : 400 }}>
                              {bonusAtt > 0 ? `${bonusAtt.toLocaleString('ar-SA')} ﷼` : '-'}
                            </td>
                            <td style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '0.95rem' }}>
                              {computedNet.toLocaleString('ar-SA')} ﷼
                            </td>
                            <td>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePaidLeaveClick(s);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                title="اضغط لتغيير الإجازة المدفوعة وإضافة التفاصيل"
                              >
                                {isPaid ? (
                                  <span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', fontWeight: 700 }}>
                                    نعم ✅ ({s.paidLeaveDays || 15} يوم)
                                  </span>
                                ) : (
                                  <span className="status-badge na">لا ➖</span>
                                )}
                              </button>
                            </td>
                            <td>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDirectStatusToggle(s.id, s.status);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                title="اضغط للتغيير السريع للحالة"
                              >
                                {s.status === 'attached' && <span className="status-badge attached"><CheckCircle2 size={14} /> تم الإرفاق ✅</span>}
                                {s.status === 'missing' && <span className="status-badge missing"><XCircle size={14} /> غير مرفق ❌</span>}
                                {s.status === 'na' && <span className="status-badge na"><MinusCircle size={14} /> لا يتطلب 🚫</span>}
                              </button>
                            </td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', minWidth: '220px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px', fontWeight: s.notes ? 600 : 400, color: s.notes ? 'var(--primary-900)' : 'var(--text-muted)' }}>
                                  {s.notes || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>لا توجد ملاحظات</span>}
                                </span>
                                <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                                  <button 
                                    className="btn btn-primary btn-sm"
                                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', gap: '0.2rem' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartRowEdit(s);
                                    }}
                                    title="تعديل صف الراتب كاملاً"
                                  >
                                    <Edit3 size={13} /> تعديل الصف
                                  </button>
                                  <button 
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingNotesSalary(s);
                                      setNotesText(s.notes || '');
                                    }}
                                    title="إضافة أو تعديل ملاحظات سريعة"
                                  >
                                    📝
                                  </button>
                                </div>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LEFT SIDE: Dedicated Side Attachment Preview & Upload Panel (Sticky) */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div className="card" style={{ margin: 0, borderColor: selectedSalaryForPanel ? 'var(--primary-500)' : 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
            <div className="card-header" style={{ paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '1rem', color: 'var(--primary-900)' }}>
                  <Paperclip color="var(--primary-600)" size={20} />
                  معاينة ومرفقات الشهر المحدد
                </h3>
              </div>

              {selectedSalaryForPanel && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const attToView = previewAttachment || currentMonthAttachments[0];
                    if (attToView) {
                      setFullscreenAttachment(attToView);
                    } else {
                      setActiveModalSalary(selectedSalaryForPanel);
                    }
                  }}
                  title="فتح النافذة الكبيرة بالكامل لتحديد وتظليل المستند"
                >
                  <Eye size={15} /> النافذة الكبيرة الشاملة
                </button>
              )}
            </div>

            {!selectedSalaryForPanel ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <AlertCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <div>اضغط على أي شهر من الجدول لمعاينة ورسم مرفقاته هنا مباشرة.</div>
              </div>
            ) : (
              <div>
                {/* Upload & Clipboard Dropzone */}
                <div style={{ marginBottom: '1rem' }}>
                  <label 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '1rem', 
                      border: '2px dashed var(--primary-500)', 
                      borderRadius: 'var(--radius-lg)', 
                      backgroundColor: 'var(--primary-50)', 
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <Upload size={24} color="var(--primary-600)" style={{ marginBottom: '0.25rem' }} />
                    <span style={{ fontWeight: 700, color: 'var(--primary-700)', fontSize: '0.85rem' }}>
                      رفع إثبات (صورة / PDF) أو لصق سكرين شوت (Ctrl + V)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      📸 اضغط هنا لاختيار ملف أو خذ لقطة شاشة واضغط Ctrl+V مباشرة!
                    </span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      multiple 
                      onChange={handleSidePanelFileUpload}
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>

                {/* Attachments List for Current Month */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>المرفقات المرفوعة ({currentMonthAttachments.length}):</span>
                    {selectedSalaryForPanel.status === 'attached' && <span className="status-badge attached">تم الإرفاق ✅</span>}
                    {selectedSalaryForPanel.status === 'missing' && <span className="status-badge missing">غير مرفق ❌</span>}
                  </div>

                  {currentMonthAttachments.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed #cbd5e1' }}>
                      لا يوجد إثبات صرف مرفوع لشهر {selectedSalaryForPanel.yearMonth} بعد.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                      {currentMonthAttachments.map((att) => (
                        <div 
                          key={att.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.4rem 0.6rem',
                            background: previewAttachment?.id === att.id ? '#eff6ff' : '#ffffff',
                            border: `1px solid ${previewAttachment?.id === att.id ? 'var(--primary-500)' : 'var(--border-color)'}`,
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer'
                          }}
                          onClick={() => setPreviewAttachment(att)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                            <FileText size={16} color="var(--primary-600)" style={{ flexShrink: 0 }} />
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {att.fileName}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.2rem' }}>
                            <button 
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.4rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const a = document.createElement('a');
                                a.href = att.fileData;
                                a.download = att.fileName;
                                a.click();
                              }}
                              title="تنزيل الملف"
                            >
                              <Download size={13} />
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.2rem 0.4rem' }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                await db.attachments.delete(att.id);
                                if (previewAttachment?.id === att.id) setPreviewAttachment(null);

                                const remaining = currentMonthAttachments.filter(a => a.id !== att.id);
                                if (remaining.length === 0 && selectedSalaryForPanel?.status === 'attached') {
                                  await db.salaries.update(selectedSalaryForPanel.id, { status: 'missing' });
                                  setSelectedSalaryForPanel(prev => prev ? { ...prev, status: 'missing' } : null);
                                }
                                await pushToServer();
                              }}
                              title="حذف المرفق"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inline Live Preview Box (PDF / Image Reader) */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: '#0f172a', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  {(() => {
                    const validPreview = (previewAttachment && currentMonthAttachments.some(a => a.id === previewAttachment.id)) ? previewAttachment : null;
                    const activeAtt = validPreview || (currentMonthAttachments.length > 0 ? currentMonthAttachments[0] : null);

                    if (!activeAtt) {
                      return (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem 1rem', fontSize: '0.85rem' }}>
                          <Image size={36} style={{ marginBottom: '0.4rem', opacity: 0.35 }} />
                          <div style={{ fontWeight: 600, color: '#e2e8f0' }}>نافذة المعاينة المباشرة</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.2rem', color: '#94a3b8' }}>
                            لا توجد مرفقات مرفوعة لشهر ({selectedSalaryForPanel.yearMonth}).
                          </div>
                        </div>
                      );
                    }

                    const box = activeAtt.highlightBox;
                    return (
                      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {activeAtt.fileType.startsWith('image/') ? (
                          <img 
                            src={activeAtt.fileData} 
                            alt={activeAtt.fileName} 
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} 
                          />
                        ) : (
                          <iframe 
                            src={activeAtt.fileData} 
                            title={activeAtt.fileName} 
                            style={{ width: '100%', height: '100%', border: 'none' }} 
                          />
                        )}

                        {/* Render Saved Spotlight Highlight Box in Left Side Panel */}
                        {box && box.active && (
                          <div 
                            style={{ 
                              position: 'absolute', 
                              top: `${box.y}%`, 
                              left: `${box.x || 2}%`, 
                              width: `${box.width || 96}%`, 
                              height: `${box.height}%`, 
                              border: '2px solid #2563eb', 
                              backgroundColor: 'rgba(37, 99, 235, 0.18)', 
                              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)', 
                              borderRadius: '4px', 
                              pointerEvents: 'none',
                              zIndex: 10
                            }}
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal: Paid Leave Details */}
      {paidLeaveModalSalary && (
        <div className="modal-overlay" onClick={() => setPaidLeaveModalSalary(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                🏖️ تفاصيل الإجازة المدفوعة لشهر ({paidLeaveModalSalary.yearMonth})
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setPaidLeaveModalSalary(null)}>✕</button>
            </div>

            <form onSubmit={handleSavePaidLeaveDetails}>
              <div className="form-group">
                <label className="form-label">نوع الإجازة *</label>
                <select 
                  className="form-control"
                  value={paidLeaveForm.leaveType}
                  onChange={(e) => setPaidLeaveForm({ ...paidLeaveForm, leaveType: e.target.value })}
                >
                  <option value="إجازة سنوية (اعتيادية)">إجازة سنوية (اعتيادية) 🏖️</option>
                  <option value="إجازة مرضية مدفوعة">إجازة مرَضية مدفوعة 🏥</option>
                  <option value="إجازة اضطرارية">إجازة اضطرارية ⚡</option>
                  <option value="إجازة حج / عمرة">إجازة حج / عمرة 🕋</option>
                  <option value="إجازة مدفوعة أخرى">إجازة مدفوعة أخرى 📝</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">عدد الأيام المستفادة من رصيد الإجازات *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required
                  min={1}
                  max={60}
                  value={paidLeaveForm.daysCount}
                  onChange={(e) => setPaidLeaveForm({ ...paidLeaveForm, daysCount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ملاحظات وتفاصيل الإجازة</label>
                <textarea 
                  className="form-control"
                  rows={3}
                  placeholder="مثال: تم تصفية 15 يوماً من رصيد الإجازات المتبقي..."
                  value={paidLeaveForm.notes}
                  onChange={(e) => setPaidLeaveForm({ ...paidLeaveForm, notes: e.target.value })}
                />
              </div>

              <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid #bae6fd', fontSize: '0.85rem', color: '#0369a1' }}>
                💡 سيتم ربط وتوثيق هذه الإجازة تلقائياً في تبويب <strong>"رصيد الإجازات المستخدم"</strong> للموظف.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPaidLeaveModalSalary(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ وتوثيق الإجازة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Month Notes */}
      {editingNotesSalary && (
        <div className="modal-overlay" onClick={() => setEditingNotesSalary(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                📝 كتابة وتعديل ملاحظات شهر ({editingNotesSalary.yearMonth})
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setEditingNotesSalary(null)}>✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              await db.salaries.update(editingNotesSalary.id, { notes: notesText });
              setEditingNotesSalary(null);
            }}>
              <div className="form-group">
                <label className="form-label">ملاحظات وقيد الصرف لشهر ({editingNotesSalary.yearMonth})</label>
                <textarea 
                  className="form-control"
                  rows={4}
                  placeholder="اكتب هنا أي ملاحظات خاصة بالراتب، رقم الشيك، الاستقطاعات، أو طريقة الصرف..."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Quick Presets */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  عبارات سريعة للاختيار:
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    'تم الصرف تحويل بنكي 🏦',
                    'تم الصرف بشيك 📜',
                    'خصم أجزاء غياب ⚠️',
                    'تسليم مالي يدوي 🤝',
                    'تصفية مستحقات ختامية 💼'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => setNotesText(prev => prev ? `${prev} | ${preset}` : preset)}
                    >
                      + {preset}
                    </button>
                  ))}
                  {notesText && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => setNotesText('')}
                    >
                      مسح 🧹
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingNotesSalary(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الملاحظة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachment Manager Modal */}
      {activeModalSalary && (
        <AttachmentManagerModal
          isOpen={true}
          onClose={() => setActiveModalSalary(null)}
          employeeId={employeeId}
          category="salary"
          refId={activeModalSalary.id}
          title={`إثبات صرف راتب شهر: ${activeModalSalary.yearMonth}`}
          currentStatus={activeModalSalary.status}
          onStatusChange={async (newStatus) => {
            await db.salaries.update(activeModalSalary.id, { status: newStatus });
            setActiveModalSalary(prev => prev ? { ...prev, status: newStatus } : null);
          }}
        />
      )}
      {/* Fullscreen Viewer Modal with Spotlight Highlight Frame Tool */}
      {fullscreenAttachment && (
        <FullscreenViewerModal
          attachment={fullscreenAttachment}
          onClose={() => setFullscreenAttachment(null)}
          onSaveHighlight={(updated) => setPreviewAttachment(updated)}
        />
      )}
    </div>
  );
}
