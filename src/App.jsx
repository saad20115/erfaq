import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedDemoDataIfEmpty, getEmployeeStats, createOrGetHaniEmployee } from './db/database';

// Import Components
import Header from './components/Header';
import EmployeeProfileForm from './components/EmployeeProfileForm';
import ContractsTab from './components/ContractsTab';
import SalariesTab from './components/SalariesTab';
import BonusesTab from './components/BonusesTab';
import OtherPaymentsTab from './components/OtherPaymentsTab';
import LeavesTab from './components/LeavesTab';
import DetailedReportTab from './components/DetailedReportTab';
import AggregateDashboardTab from './components/AggregateDashboardTab';
import BackupRestoreModal from './components/BackupRestoreModal';
import FinalSettlementTab from './components/FinalSettlementTab';

// Lucide Icons
import { 
  Calendar, FileText, Award, DollarSign, 
  UserCheck, ShieldCheck, CheckCircle2, XCircle, 
  MinusCircle, Plus, Users, Layers, AlertCircle, Scale
} from 'lucide-react';

export default function App() {
  const [activeMainTab, setActiveMainTab] = useState('employee'); // 'employee' | 'aggregate'
  const [activeEmpSubTab, setActiveEmpSubTab] = useState('salaries'); // 'salaries' | 'contracts' | 'bonuses' | 'other' | 'leaves' | 'report'
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  
  const [isNewEmpModalOpen, setIsNewEmpModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [empStats, setEmpStats] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch employees reactively
  const employees = useLiveQuery(() => db.employees.toArray()) || [];

  // Seed demo data and guarantee Hani Mustafa is loaded automatically
  useEffect(() => {
    async function initData() {
      try {
        await seedDemoDataIfEmpty();
        const haniId = await createOrGetHaniEmployee();
        if (haniId) {
          setSelectedEmpId(haniId);
        }
      } catch (err) {
        console.warn('Initialization error:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    initData();
  }, []);

  // Periodic background sync with central MySQL server every 20 seconds for multi-user team collaboration
  useEffect(() => {
    const interval = setInterval(() => {
      syncWithServer();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Select first employee automatically if none selected or if empty
  useEffect(() => {
    if (!isInitializing && employees.length === 0) {
      createOrGetHaniEmployee().then((haniId) => {
        if (haniId) setSelectedEmpId(haniId);
      });
    } else if (employees.length > 0 && (!selectedEmpId || !employees.some(e => e.id === selectedEmpId))) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, selectedEmpId, isInitializing]);

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);

  // Load stats for current selected employee
  useEffect(() => {
    if (selectedEmpId) {
      getEmployeeStats(selectedEmpId).then(setEmpStats);
    }
  }, [selectedEmpId]);

  const handleSelectEmployee = (id) => {
    setSelectedEmpId(id);
    setActiveMainTab('employee');
  };

  return (
    <div className="app-container">
      {/* App Header Bar */}
      <Header 
        employees={employees}
        selectedEmpId={selectedEmpId}
        onSelectEmp={handleSelectEmployee}
        onOpenNewEmpModal={() => setIsNewEmpModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        activeMainTab={activeMainTab}
        setActiveMainTab={setActiveMainTab}
      />

      {/* Main Container */}
      <main className="main-content">
        {activeMainTab === 'aggregate' ? (
          <AggregateDashboardTab onSelectEmployee={handleSelectEmployee} />
        ) : (
          <div>
            {/* If initializing or no employee exists */}
            {isInitializing || employees.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #cbd5e1', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>جاري تجهيز قاعدة البيانات المحلية وتوليد ملف المهندس هاني...</h3>
              </div>
            ) : selectedEmployee ? (
              <div>
                {/* Employee Profile Header Summary Form */}
                <EmployeeProfileForm 
                  employee={selectedEmployee}
                  onSave={(id) => setSelectedEmpId(id)}
                  onDelete={() => {
                    const remaining = employees.filter(e => e.id !== selectedEmployee.id);
                    if (remaining.length > 0) setSelectedEmpId(remaining[0].id);
                    else setSelectedEmpId(null);
                  }}
                />

                {/* Sub-Tabs Header Navigation for Selected Employee */}
                <div className="tabs-header">
                  <button 
                    className={`tab-btn ${activeEmpSubTab === 'salaries' ? 'active' : ''}`}
                    onClick={() => setActiveEmpSubTab('salaries')}
                  >
                    <Calendar size={18} />
                    الرواتب الشهرية (2020-2025)
                    {empStats && empStats.salariesCount > 0 && (
                      <span style={{ background: '#e2e8f0', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        {empStats.salariesCount}
                      </span>
                    )}
                  </button>

                  <button 
                    className={`tab-btn ${activeEmpSubTab === 'contracts' ? 'active' : ''}`}
                    onClick={() => setActiveEmpSubTab('contracts')}
                  >
                    <FileText size={18} />
                    العقود والملاحظات
                    {empStats && empStats.contractsCount > 0 && (
                      <span style={{ background: '#e2e8f0', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        {empStats.contractsCount}
                      </span>
                    )}
                  </button>

                  <button 
                    className={`tab-btn ${activeEmpSubTab === 'bonuses' ? 'active' : ''}`}
                    onClick={() => setActiveEmpSubTab('bonuses')}
                  >
                    <Award size={18} />
                    المكافآت والإضافي
                    {empStats && empStats.bonusesCount > 0 && (
                      <span style={{ background: '#e2e8f0', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        {empStats.bonusesCount}
                      </span>
                    )}
                  </button>

                  <button 
                    className={`tab-btn ${activeEmpSubTab === 'other' ? 'active' : ''}`}
                    onClick={() => setActiveEmpSubTab('other')}
                  >
                    <DollarSign size={18} />
                    المصروفات والأخرى
                    {empStats && empStats.othersCount > 0 && (
                      <span style={{ background: '#e2e8f0', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        {empStats.othersCount}
                      </span>
                    )}
                  </button>

                  <button 
                    className={`tab-btn ${activeEmpSubTab === 'leaves' ? 'active' : ''}`}
                    onClick={() => setActiveEmpSubTab('leaves')}
                  >
                    <UserCheck size={18} />
                    رصيد الإجازات المستخدم
                    {empStats && empStats.leavesCount > 0 && (
                      <span style={{ background: '#e2e8f0', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        {empStats.leavesCount}
                      </span>
                    )}
                  </button>

                  <button 
                    className={`tab-btn ${activeEmpSubTab === 'settlement' ? 'active' : ''}`}
                    onClick={() => setActiveEmpSubTab('settlement')}
                    style={{ color: '#059669', fontWeight: 800, backgroundColor: activeEmpSubTab === 'settlement' ? '#ecfdf5' : 'transparent', border: '1px solid #10b981' }}
                  >
                    <Scale size={18} />
                    ⚖️ جدول المخالصة النهائية والردود
                  </button>

                  <button 
                    className={`tab-btn ${activeEmpSubTab === 'report' ? 'active' : ''}`}
                    onClick={() => setActiveEmpSubTab('report')}
                    style={{ marginRight: 'auto', color: 'var(--primary-700)', fontWeight: 800 }}
                  >
                    <ShieldCheck size={18} />
                    التقرير التفصيلي والمجمع
                  </button>
                </div>

                {/* Sub-Tab Content View */}
                {activeEmpSubTab === 'salaries' && <SalariesTab employee={selectedEmployee} />}
                {activeEmpSubTab === 'contracts' && <ContractsTab employeeId={selectedEmployee.id} />}
                {activeEmpSubTab === 'bonuses' && <BonusesTab employeeId={selectedEmployee.id} />}
                {activeEmpSubTab === 'other' && <OtherPaymentsTab employeeId={selectedEmployee.id} />}
                {activeEmpSubTab === 'leaves' && <LeavesTab employeeId={selectedEmployee.id} />}
                {activeEmpSubTab === 'settlement' && <FinalSettlementTab employee={selectedEmployee} />}
                {activeEmpSubTab === 'report' && <DetailedReportTab employee={selectedEmployee} />}
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Modal: New Employee Creation */}
      {isNewEmpModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewEmpModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>إضافة موظف جديد ونطاق التتبع</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsNewEmpModalOpen(false)}>✕</button>
            </div>
            <EmployeeProfileForm 
              employee={null} 
              onSave={(newId) => {
                setSelectedEmpId(newId);
                setIsNewEmpModalOpen(false);
                setActiveMainTab('employee');
              }} 
            />
          </div>
        </div>
      )}

      {/* Modal: Backup & Restore */}
      <BackupRestoreModal 
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
}
