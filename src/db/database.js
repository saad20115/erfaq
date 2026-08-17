import Dexie from 'dexie';

// Initialize Dexie IndexedDB Database
export const db = new Dexie('MorfaqatDB');

// Define database schema
db.version(1).stores({
  employees: '++id, empId, name, civilId, department, createdAt',
  contracts: '++id, employeeId, contractNumber, status',
  salaries: '++id, [employeeId+yearMonth], employeeId, yearMonth, status',
  bonuses: '++id, employeeId, type, date, status',
  otherPayments: '++id, employeeId, date, status',
  leaves: '++id, employeeId, leaveType, startDate, status',
  attachments: '++id, employeeId, category, refId, fileName'
});

// Central Server Sync
export async function syncWithServer() {
  try {
    const localAtts = await db.attachments.toArray();
    const localWithHighlight = localAtts.filter(a => a.highlightBox && a.highlightBox.active);

    const res = await fetch('/api/db');
    if (res.ok) {
      const serverData = await res.json();
      const serverAtts = serverData.attachments || [];

      // If local storage has attachments with saved highlights and server has fewer, PUSH local to server!
      if (localAtts.length > 0 && (serverAtts.length === 0 || localWithHighlight.length > 0)) {
        await pushToServer();
        return true;
      }

      if (serverData && serverData.employees && serverData.employees.length > 0) {
        await db.transaction('rw', [db.employees, db.contracts, db.salaries, db.bonuses, db.otherPayments, db.leaves, db.attachments], async () => {
          await db.employees.clear();
          await db.contracts.clear();
          await db.salaries.clear();
          await db.bonuses.clear();
          await db.otherPayments.clear();
          await db.leaves.clear();
          await db.attachments.clear();

          if (serverData.employees?.length) await db.employees.bulkAdd(serverData.employees);
          if (serverData.contracts?.length) await db.contracts.bulkAdd(serverData.contracts);
          if (serverData.salaries?.length) await db.salaries.bulkAdd(serverData.salaries);
          if (serverData.bonuses?.length) await db.bonuses.bulkAdd(serverData.bonuses);
          if (serverData.otherPayments?.length) await db.otherPayments.bulkAdd(serverData.otherPayments);
          if (serverData.leaves?.length) await db.leaves.bulkAdd(serverData.leaves);
          if (serverData.attachments?.length) await db.attachments.bulkAdd(serverData.attachments);
        });
        return true;
      }
    }
  } catch (err) {
    console.log('Central Server API offline, using local IndexedDB.', err);
  }
  return false;
}

export async function pushToServer() {
  try {
    const employees = await db.employees.toArray();
    const contracts = await db.contracts.toArray();
    const salaries = await db.salaries.toArray();
    const bonuses = await db.bonuses.toArray();
    const otherPayments = await db.otherPayments.toArray();
    const leaves = await db.leaves.toArray();
    const attachments = await db.attachments.toArray();

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employees, contracts, salaries, bonuses, otherPayments, leaves, attachments
      })
    });
  } catch (e) {
    console.warn('Could not push to central server API', e);
  }
}

// Helper: Calculate months list between startYearMonth ('2020-01') and endYearMonth ('2025-01')
export function generateMonthList(startYM = '2020-01', endYM = '2025-01') {
  const months = [];
  const [sYear, sMonth] = startYM.split('-').map(Number);
  const [eYear, eMonth] = endYM.split('-').map(Number);

  let currentYear = sYear;
  let currentMonth = sMonth;

  while (
    currentYear < eYear || 
    (currentYear === eYear && currentMonth <= eMonth)
  ) {
    const monthStr = String(currentMonth).padStart(2, '0');
    months.push(`${currentYear}-${monthStr}`);

    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  return months;
}

// Generate missing salary records for employee for period
export async function ensureMonthlySalaryRecords(employeeId, startYM = '2020-01', endYM = '2025-01', defaultBasic = 8000, defaultAllowances = 1000) {
  const targetMonths = generateMonthList(startYM, endYM);
  const existingSalaries = await db.salaries.where('employeeId').equals(employeeId).toArray();
  const existingYMMap = new Set(existingSalaries.map(s => s.yearMonth));

  const newRecords = [];
  for (const ym of targetMonths) {
    if (!existingYMMap.has(ym)) {
      newRecords.push({
        employeeId,
        yearMonth: ym,
        basicSalary: Number(defaultBasic) || 0,
        allowances: Number(defaultAllowances) || 0,
        deductions: 0,
        netSalary: (Number(defaultBasic) || 0) + (Number(defaultAllowances) || 0),
        notes: '',
        status: 'missing', // default status 'missing' (❌)
        updatedAt: new Date().toISOString()
      });
    }
  }

  if (newRecords.length > 0) {
    await db.salaries.bulkAdd(newRecords);
  }
}

// Helper: Calculate employee compliance summary (attached %, missing count, total items)
export async function getEmployeeStats(employeeId) {
  const contracts = await db.contracts.where('employeeId').equals(employeeId).toArray();
  const salaries = await db.salaries.where('employeeId').equals(employeeId).toArray();
  const bonuses = await db.bonuses.where('employeeId').equals(employeeId).toArray();
  const others = await db.otherPayments.where('employeeId').equals(employeeId).toArray();
  const leaves = await db.leaves.where('employeeId').equals(employeeId).toArray();

  const allItems = [...contracts, ...salaries, ...bonuses, ...others, ...leaves];
  
  let attachedCount = 0;
  let missingCount = 0;
  let naCount = 0;

  allItems.forEach(item => {
    if (item.status === 'attached') attachedCount++;
    else if (item.status === 'na') naCount++;
    else missingCount++;
  });

  const totalRequired = attachedCount + missingCount;
  const complianceRate = totalRequired > 0 ? Math.round((attachedCount / totalRequired) * 100) : 100;

  // Calculate total money values
  const totalSalariesPaid = salaries.reduce((acc, s) => acc + (Number(s.netSalary) || 0), 0);
  const totalBonusesPaid = bonuses.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const totalOthersPaid = others.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

  return {
    totalItems: allItems.length,
    attachedCount,
    missingCount,
    naCount,
    complianceRate,
    contractsCount: contracts.length,
    salariesCount: salaries.length,
    bonusesCount: bonuses.length,
    othersCount: others.length,
    leavesCount: leaves.length,
    totalSalariesPaid,
    totalBonusesPaid,
    totalOthersPaid
  };
}

// Full Database Export to JSON file
export async function exportDatabaseBackup() {
  const employees = await db.employees.toArray();
  const contracts = await db.contracts.toArray();
  const salaries = await db.salaries.toArray();
  const bonuses = await db.bonuses.toArray();
  const otherPayments = await db.otherPayments.toArray();
  const leaves = await db.leaves.toArray();
  const attachmentsRaw = await db.attachments.toArray();

  // Convert File Blobs or URL paths to base64 data URLs for JSON serialization
  const attachments = await Promise.all(attachmentsRaw.map(async (att) => {
    let base64 = att.fileData;
    if (att.fileData instanceof Blob) {
      base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(att.fileData);
      });
    } else if (typeof att.fileData === 'string' && (att.fileData.startsWith('/') || att.fileData.startsWith('http'))) {
      try {
        const resp = await fetch(att.fileData);
        const blob = await resp.blob();
        base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn('Could not convert static path to base64', err);
      }
    }

    return {
      ...att,
      fileData: base64
    };
  }));

  const backupObj = {
    app: 'MorfaqatApp',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      employees,
      contracts,
      salaries,
      bonuses,
      otherPayments,
      leaves,
      attachments
    }
  };

  const jsonStr = JSON.stringify(backupObj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `morfaqat_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Full Database Import from JSON
export async function importDatabaseBackup(jsonString) {
  const parsed = JSON.parse(jsonString);
  if (!parsed.data) throw new Error('ملف النسخة الاحتياطية غير صالح.');

  await db.transaction('rw', [db.employees, db.contracts, db.salaries, db.bonuses, db.otherPayments, db.leaves, db.attachments], async () => {
    await db.employees.clear();
    await db.contracts.clear();
    await db.salaries.clear();
    await db.bonuses.clear();
    await db.otherPayments.clear();
    await db.leaves.clear();
    await db.attachments.clear();

    const { employees, contracts, salaries, bonuses, otherPayments, leaves, attachments } = parsed.data;

    if (employees && employees.length) await db.employees.bulkAdd(employees);
    if (contracts && contracts.length) await db.contracts.bulkAdd(contracts);
    if (salaries && salaries.length) await db.salaries.bulkAdd(salaries);
    if (bonuses && bonuses.length) await db.bonuses.bulkAdd(bonuses);
    if (otherPayments && otherPayments.length) await db.otherPayments.bulkAdd(otherPayments);
    if (leaves && leaves.length) await db.leaves.bulkAdd(leaves);

    if (attachments && attachments.length) {
      await db.attachments.bulkAdd(attachments);
    }
  });

  await pushToServer();
}

// Helper: Seed initial clean data
export async function seedDemoDataIfEmpty() {
  const synced = await syncWithServer();
  if (!synced) {
    const empCount = await db.employees.count();
    if (empCount === 0) {
      await createOrGetHaniEmployee();
      await pushToServer();
    }
  }
}



// Function to prepare clean database for Employee Hani Mustafa Hafiz Abu Awad
export async function createOrGetHaniEmployee() {
  let emp = await db.employees.where('name').equals('هاني مصطفي حافظ ابو عوض').first();
  let empId;

  if (!emp) {
    empId = await db.employees.add({
      name: 'هاني مصطفي حافظ ابو عوض',
      empId: '',
      civilId: '',
      jobTitle: 'مهندس مدني',
      department: 'الهندسة المدنية',
      startDate: '2020-01',
      endDate: '2025-01',
      defaultSalary: 15000,
      notes: '',
      createdAt: new Date().toISOString()
    });
  } else {
    empId = emp.id;
  }

  // Generate / update 61 salary months (2020-01 to 2025-01)
  const monthList = generateMonthList('2020-01', '2025-01');
  const existingSalaries = await db.salaries.where('employeeId').equals(empId).toArray();
  const existingMap = new Map(existingSalaries.map(s => [s.yearMonth, s]));

  for (const ym of monthList) {
    const existing = existingMap.get(ym);
    const isJan2025 = ym === '2025-01';
    const isDec2024 = ym === '2024-12';
    const janNotes = 'مسير رواتب البنك السعودي للاستثمار (SAIB) - تحويل لحساب SABB رقم SA5945000000034129544150 | إجمالي 15,000 ﷼ - خصم 2,632.33 ﷼ = صافي 12,367.67 ﷼';

    if (!existing) {
      const newSalaryId = await db.salaries.add({
        employeeId: empId,
        yearMonth: ym,
        basicSalary: isJan2025 ? 7000 : 15000,
        carAllowance: 1500,
        phoneAllowance: 375,
        bonusesOrOvertime: isJan2025 ? 5000 : 0,
        allowances: 1875,
        deductions: isJan2025 ? 2632.33 : 0,
        netSalary: isJan2025 ? 12367.67 : 16875,
        notes: isJan2025 ? janNotes : '',
        status: (isJan2025 || isDec2024) ? 'attached' : 'missing',
        updatedAt: new Date().toISOString()
      });

      if (isJan2025) {
        await db.attachments.add({
          employeeId: empId,
          category: 'salary',
          refId: newSalaryId,
          fileName: 'اثبات_صرف_راتب_يناير_2025_البنك_السعودي_للاستثمار.png',
          fileType: 'image/png',
          fileSize: 128461,
          fileData: '/jan_2025_statement.png',
          highlightBox: { active: true, y: 68, height: 25, width: 96, x: 2 },
          uploadDate: new Date().toISOString()
        });
      }
    } else {
      // Existing record: NEVER overwrite user manual edits!
      // Only ensure January 2025 bank statement attachment exists if missing
      if (isJan2025) {
        const attCount = await db.attachments.where({ employeeId: empId, category: 'salary', refId: existing.id }).count();
        if (attCount === 0) {
          await db.attachments.add({
            employeeId: empId,
            category: 'salary',
            refId: existing.id,
            fileName: 'اثبات_صرف_راتب_يناير_2025_البنك_السعودي_للاستثمار.png',
            fileType: 'image/png',
            fileSize: 128461,
            fileData: '/jan_2025_statement.png',
            highlightBox: { active: true, y: 68, height: 25, width: 96, x: 2 },
            uploadDate: new Date().toISOString()
          });
          if (existing.status !== 'attached') {
            await db.salaries.update(existing.id, { status: 'attached' });
          }
        }
      }
    }
  }

  return empId;
}

// Clean helper to reset DB cleanly for user
export async function resetDatabaseForUser() {
  await db.employees.clear();
  await db.contracts.clear();
  await db.salaries.clear();
  await db.bonuses.clear();
  await db.otherPayments.clear();
  await db.leaves.clear();
  await db.attachments.clear();

  return await createOrGetHaniEmployee();
}


