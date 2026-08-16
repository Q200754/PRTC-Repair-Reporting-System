/**
 * PRTC Repair Reporting System - Core Controller
 * วิทยาลัยเทคโนโลยีพระมหาไถ่ พัทยา
 */

// ==========================================
// 1. STATE & MOCK DATA
// ==========================================
let currentRole = 'user'; // 'user' | 'admin' | 'technician'

const users = {
    user: { name: 'ครูสมชาย ดีใจ', role: 'USER', roleText: 'ครูผู้สอน / ฝ่ายวิชาการ', position: 'ครูผู้สอน', department: 'ฝ่ายวิชาการ' },
    admin: { name: 'นายเกรียงไกร รักษาการ', role: 'ADMIN', roleText: 'หัวหน้าฝ่ายบริหารทรัพยากร / อาคารสถานที่', position: 'หัวหน้าฝ่าย', department: 'ฝ่ายบริหารทรัพยากร' },
    technician: { name: 'ช่างสมจิต ชำนาญการ', role: 'TECHNICIAN', roleText: 'ช่างซ่อมบำรุงประจำวิทยาลัย', position: 'ช่างซ่อมบำรุง', department: 'ฝ่ายอาคารสถานที่' }
};

const techniciansList = [
    { id: 1, name: 'ช่างสมจิต ชำนาญการ' },
    { id: 2, name: 'ช่างวิชัย ไวไว' },
    { id: 3, name: 'ช่างอนันต์ เครื่องเย็น' }
];

let inventoryData = [
    { id: 1, name: 'หลอดไฟ LED T5 18W', stock: 12, min: 5, price: 95, unit: 'หลอด' },
    { id: 2, name: 'ก๊อกน้ำสแตนเลส 1/2 นิ้ว', stock: 8, min: 3, price: 120, unit: 'ตัว' },
    { id: 3, name: 'ลูกบิดประตูห้องเรียน SOLEX', stock: 4, min: 2, price: 280, unit: 'ชุด' },
    { id: 4, name: 'รีโมทเครื่องปรับอากาศ Universal', stock: 4, min: 5, price: 180, unit: 'อัน' }
];

let repairRequests = [{
        id: 'REP-202608-001',
        createdDate: '2026-08-16',
        requesterName: 'ครูสมชาย ดีใจ',
        position: 'ครูผู้สอน',
        department: 'ฝ่ายวิชาการ',
        urgency: 'urgent',
        status: 'PENDING', // PENDING, ASSIGNED, IN_PROGRESS, WAITING_ACCEPTANCE, COMPLETED, REWORK
        items: [
            { id: 1, description: 'เครื่องปรับอากาศไม่เย็น มีลมร้อนออกมา', location: 'อาคาร 1 ชั้น 2 ห้องคอมพิวเตอร์ 101' }
        ],
        photo: null,
        adminApproval: null,
        technicianAction: null,
        userAcceptance: null,
        timeline: [
            { statusText: 'สร้างใบแจ้งซ่อม', timestamp: '2026-08-16 09:30', note: 'ผู้แจ้งส่งคำขอเข้าระบบ' }
        ]
    },
    {
        id: 'REP-202608-002',
        createdDate: '2026-08-15',
        requesterName: 'นางสาววิไลลักษณ์ พัทยา',
        position: 'เจ้าหน้าที่ธุรการ',
        department: 'ฝ่ายทะเบียน',
        urgency: 'normal',
        status: 'IN_PROGRESS',
        items: [
            { id: 1, description: 'หลอดไฟกระพริบ 2 หลอด', location: 'อาคารอำนวยการ ชั้น 1 ห้องปกครอง' }
        ],
        photo: null,
        adminApproval: {
            adminName: 'นายเกรียงไกร รักษาการ',
            assignedTech: 'ช่างสมจิต ชำนาญการ',
            comment: 'ตรวจเช็คบัลลาสต์ด้วย',
            assignedAt: '2026-08-15 11:00',
            signature: null
        },
        technicianAction: null,
        userAcceptance: null,
        timeline: [
            { statusText: 'สร้างใบแจ้งซ่อม', timestamp: '2026-08-15 10:15', note: 'ผู้แจ้งส่งคำขอเข้าระบบ' },
            { statusText: 'หัวหน้ารับทราบ & จ่ายงาน', timestamp: '2026-08-15 11:00', note: 'มอบหมายช่างสมจิต ชำนาญการ' }
        ]
    }
];

let selectedTechParts = [];
let currentRating = 5;

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initRoleSwitcher();
    initDateInputs();
    initSignatureCanvases();
    initRatingStars();
    initModalsClose();

    // โหลดหน้าแรกของ User
    switchRole('user');
});

// กำหนดวันที่เริ่มต้น
function initDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('eformReportDate');
    if (dateInput) dateInput.value = today;
}

// ==========================================
// 3. ROLE & SCREEN NAVIGATION
// ==========================================
function initRoleSwitcher() {
    const select = document.getElementById('roleSwitcherSelect');
    select.innerHTML = `
    <option value="user">ผู้แจ้งซ่อม (ครู/บุคลากร)</option>
    <option value="admin">หัวหน้าฝ่ายบริหารทรัพยากร (Admin)</option>
    <option value="technician">ช่างซ่อมบำรุง (Technician)</option>
  `;
    select.addEventListener('change', (e) => switchRole(e.target.value));
}

function switchRole(role) {
    currentRole = role;
    const user = users[role];

    // อัปเดตข้อมูล Profile
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileRole').textContent = user.roleText;

    // อัปเดตเมนู Sidebar
    renderSidebarMenu(role);

    // สลับหน้าจอเริ่มต้นตาม Role (ตัด Dashboard ออกแล้ว)
    if (role === 'user') {
        showScreen('eformScreen');
        loadUserFormProfile();
    } else if (role === 'admin') {
        showScreen('adminRequestsScreen');
        renderAdminRequestsTable();
        renderInventoryTable();
    } else if (role === 'technician') {
        showScreen('techTasksScreen');
        renderTechTasksTable();
    }
}

function renderSidebarMenu(role) {
    const menu = document.getElementById('sidebarMenu');
    menu.innerHTML = '';

    let items = [];
    if (role === 'user') {
        items = [
            { id: 'eformScreen', icon: 'fas fa-edit', label: 'แบบฟอร์มแจ้งซ่อม' },
            { id: 'historyScreen', icon: 'fas fa-history', label: 'ติดตามสถานะ & ประวัติ' }
        ];
    } else if (role === 'admin') {
        items = [
            { id: 'adminRequestsScreen', icon: 'fas fa-tasks', label: 'จัดการจ่ายงาน & ใบแจ้งซ่อม' },
            { id: 'adminInventoryScreen', icon: 'fas fa-boxes', label: 'สต็อกอะไหล่' }
        ];
    } else if (role === 'technician') {
        items = [
            { id: 'techTasksScreen', icon: 'fas fa-wrench', label: 'งานซ่อมที่ได้รับมอบหมาย' }
        ];
    }

    items.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = `w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
      index === 0 ? 'bg-blue-50 text-brand-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
    }`;
        btn.innerHTML = `<i class="${item.icon}"></i> <span>${item.label}</span>`;
        btn.onclick = () => {
            document.querySelectorAll('#sidebarMenu button').forEach(b => {
                b.className = 'w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition text-slate-600 hover:bg-slate-50';
            });
            btn.className = 'w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition bg-blue-50 text-brand-900 font-bold';
            showScreen(item.id);
        };
        menu.appendChild(btn);
    });
}

function showScreen(screenId) {
    const screens = ['eformScreen', 'historyScreen', 'adminRequestsScreen', 'adminInventoryScreen', 'techTasksScreen'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');

    if (screenId === 'historyScreen') renderUserHistory();
    if (screenId === 'adminRequestsScreen') renderAdminRequestsTable();
    if (screenId === 'adminInventoryScreen') renderInventoryTable();
    if (screenId === 'techTasksScreen') renderTechTasksTable();
}

// ==========================================
// 4. E-FORM LOGIC (USER)
// ==========================================
function loadUserFormProfile() {
    const user = users.user;
    document.getElementById('eformFullName').value = user.name;
    document.getElementById('eformPosition').value = user.position;
    document.getElementById('eformDepartment').value = user.department;

    const tbody = document.getElementById('eformTableBody');
    tbody.innerHTML = '';
    addEFormRow();
}

function addEFormRow(desc = '', loc = '') {
    const tbody = document.getElementById('eformTableBody');
    const count = tbody.rows.length + 1;
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/50';
    tr.innerHTML = `
    <td class="py-2.5 px-4 text-xs font-bold text-slate-500 text-center row-num">${count}</td>
    <td class="py-2.5 px-4">
      <input type="text" value="${desc}" class="eform-item-desc w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-blue-900" placeholder="เช่น หลอดไฟเสีย, แอร์ไม่เย็น" required>
    </td>
    <td class="py-2.5 px-4">
      <input type="text" value="${loc}" class="eform-item-loc w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-blue-900" placeholder="เช่น อาคาร 1 ชั้น 2 ห้องคอม 101" required>
    </td>
    <td class="py-2.5 px-4 text-center">
      <button type="button" onclick="removeEFormRow(this)" class="text-slate-400 hover:text-red-500 text-xs px-2 py-1"><i class="fas fa-trash"></i></button>
    </td>
  `;
    tbody.appendChild(tr);
    updateRowNumbers();
}

function removeEFormRow(btn) {
    const tbody = document.getElementById('eformTableBody');
    if (tbody.rows.length > 1) {
        btn.closest('tr').remove();
        updateRowNumbers();
    } else {
        alert('ต้องมีรายการแจ้งซ่อมอย่างน้อย 1 รายการ');
    }
}

function updateRowNumbers() {
    document.querySelectorAll('#eformTableBody tr').forEach((row, i) => {
        row.querySelector('.row-num').textContent = i + 1;
    });
}

// ส่งแบบฟอร์มแจ้งซ่อม
document.getElementById('repairForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const items = [];
    document.querySelectorAll('#eformTableBody tr').forEach((row, i) => {
        const desc = row.querySelector('.eform-item-desc').value.trim();
        const loc = row.querySelector('.eform-item-loc').value.trim();
        if (desc && loc) items.push({ id: i + 1, description: desc, location: loc });
    });

    const now = new Date();
    const ticketNo = `REP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest = {
        id: ticketNo,
        createdDate: document.getElementById('eformReportDate').value,
        requesterName: document.getElementById('eformFullName').value,
        position: document.getElementById('eformPosition').value,
        department: document.getElementById('eformDepartment').value,
        urgency: 'normal',
        status: 'PENDING',
        items: items,
        photo: null,
        adminApproval: null,
        technicianAction: null,
        userAcceptance: null,
        timeline: [
            { statusText: 'สร้างใบแจ้งซ่อม', timestamp: now.toISOString().replace('T', ' ').slice(0, 16), note: 'ผู้แจ้งส่งคำขอเข้าระบบ' }
        ]
    };

    repairRequests.unshift(newRequest);
    logNotification(`📢 มีคำขอแจ้งซ่อมใหม่ [${ticketNo}] จาก ${newRequest.requesterName}`);
    alert(`ส่งใบแจ้งซ่อมเรียบร้อย! รหัสใบงาน: ${ticketNo}`);

    // ล้างฟอร์มแล้วสลับไปหน้าประวัติ
    loadUserFormProfile();
    showScreen('historyScreen');
});

// ==========================================
// 5. USER HISTORY & TRACKING
// ==========================================
function renderUserHistory() {
    const container = document.getElementById('historyListContainer');
    container.innerHTML = '';

    repairRequests.forEach(req => {
                const card = document.createElement('div');
                card.className = 'bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4';

                let statusBadge = getStatusBadge(req.status);

                card.innerHTML = `
      <div class="space-y-1.5 flex-1">
        <div class="flex items-center gap-2">
          <span class="font-mono text-xs font-bold text-slate-400">${req.id}</span>
          ${statusBadge}
          <span class="text-xs text-slate-400">| ${req.createdDate}</span>
        </div>
        <h4 class="font-bold text-slate-800 text-sm">${req.items[0]?.description || '-'}</h4>
        <p class="text-xs text-slate-500"><i class="fas fa-map-marker-alt text-red-500 mr-1"></i> ${req.items[0]?.location || '-'}</p>
      </div>

      <div class="flex items-center gap-2">
        ${
          req.status === 'WAITING_ACCEPTANCE'
            ? `<button onclick="openAcceptanceModal('${req.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition"><i class="fas fa-check-circle"></i> ตรวจรับงานซ่อม</button>`
            : ''
        }
        <button onclick="openDetailModal('${req.id}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition"><i class="fas fa-eye"></i> ดูรายละเอียด</button>
        <button onclick="printDraftPaper('${req.id}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition" title="พิมพ์ใบแจ้งซ่อม"><i class="fas fa-print"></i></button>
      </div>
    `;
    container.appendChild(card);
  });
}

// ==========================================
// 6. ADMIN REQUEST MANAGEMENT
// ==========================================
function renderAdminRequestsTable(filter = 'all') {
  const tbody = document.getElementById('adminRequestsTableBody');
  tbody.innerHTML = '';

  let filtered = repairRequests;
  if (filter === 'pending') filtered = repairRequests.filter(r => r.status === 'PENDING');
  if (filter === 'progress') filtered = repairRequests.filter(r => ['ASSIGNED', 'IN_PROGRESS'].includes(r.status));
  if (filter === 'review') filtered = repairRequests.filter(r => r.status === 'WAITING_ACCEPTANCE');
  if (filter === 'completed') filtered = repairRequests.filter(r => r.status === 'COMPLETED');

  filtered.forEach(req => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    tr.innerHTML = `
      <td class="py-3 px-4 text-xs font-mono font-bold text-center text-slate-500">${req.id}</td>
      <td class="py-3 px-4 text-xs">
        <strong class="block text-slate-800">${req.requesterName}</strong>
        <span class="text-slate-400">${req.department}</span>
      </td>
      <td class="py-3 px-4 text-xs text-slate-700">${req.items[0]?.description || '-'}</td>
      <td class="py-3 px-4 text-xs text-slate-500">${req.items[0]?.location || '-'}</td>
      <td class="py-3 px-4 text-center">${getStatusBadge(req.status)}</td>
      <td class="py-3 px-4 text-center">
        ${
          req.status === 'PENDING'
            ? `<button onclick="openAssignModal('${req.id}')" class="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">จ่ายงาน</button>`
            : `<button onclick="openDetailModal('${req.id}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg">ดูงาน</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterAdminRequests() {
  const val = document.getElementById('adminRequestFilter').value;
  renderAdminRequestsTable(val);
}

// อนุมัติและมอบหมายช่าง
let currentAssignRequestId = null;
function openAssignModal(reqId) {
  currentAssignRequestId = reqId;
  const req = repairRequests.find(r => r.id === reqId);
  if (!req) return;

  document.getElementById('assignModalId').textContent = req.id;
  document.getElementById('assignModalDesc').textContent = `${req.items[0]?.description} (${req.items[0]?.location})`;

  const select = document.getElementById('assignTechSelect');
  select.innerHTML = techniciansList.map(t => `<option value="${t.name}">${t.name}</option>`).join('');

  clearCanvas('adminAssignCanvas');
  openModal('assignModal');
}

function submitAdminAssignment() {
  const req = repairRequests.find(r => r.id === currentAssignRequestId);
  if (!req) return;

  const tech = document.getElementById('assignTechSelect').value;
  const urgency = document.querySelector('input[name="assignUrgency"]:checked').value;
  const comment = document.getElementById('assignAdminComment').value;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  req.status = 'IN_PROGRESS';
  req.urgency = urgency;
  req.adminApproval = {
    adminName: users.admin.name,
    assignedTech: tech,
    comment: comment,
    assignedAt: now,
    signature: getCanvasData('adminAssignCanvas')
  };

  req.timeline.push({
    statusText: 'หัวหน้ารับทราบ & มอบหมายช่าง',
    timestamp: now,
    note: `มอบหมายงานให้ ${tech}`
  });

  logNotification(`🔧 มอบหมายงาน [${req.id}] ให้ ${tech} เรียบร้อยแล้ว`);
  closeModal('assignModal');
  renderAdminRequestsTable();
  alert('จ่ายงานให้ช่างเรียบร้อยแล้ว');
}

// ==========================================
// 7. TECHNICIAN TASK MANAGEMENT
// ==========================================
function renderTechTasksTable() {
  const tbody = document.getElementById('techTasksTableBody');
  tbody.innerHTML = '';

  const techName = users.technician.name;
  const tasks = repairRequests.filter(r => r.adminApproval?.assignedTech === techName || r.status === 'PENDING');

  tasks.forEach(req => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    tr.innerHTML = `
      <td class="py-3 px-4 text-xs font-mono font-bold text-center text-slate-500">${req.id}</td>
      <td class="py-3 px-4 text-xs font-bold text-slate-800">${req.items[0]?.description || '-'}</td>
      <td class="py-3 px-4 text-xs text-slate-500">${req.items[0]?.location || '-'}</td>
      <td class="py-3 px-4 text-center">${getStatusBadge(req.status)}</td>
      <td class="py-3 px-4 text-center">
        ${
          req.status === 'IN_PROGRESS' || req.status === 'REWORK'
            ? `<button onclick="openTechJobModal('${req.id}')" class="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">บันทึกผลซ่อม</button>`
            : `<button onclick="openDetailModal('${req.id}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg">ดูรายละเอียด</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ช่างบันทึกผลการซ่อม
let currentTechJobRequestId = null;
function openTechJobModal(reqId) {
  currentTechJobRequestId = reqId;
  const req = repairRequests.find(r => r.id === reqId);
  if (!req) return;

  document.getElementById('techJobModalId').textContent = req.id;
  document.getElementById('techJobDesc').textContent = `${req.items[0]?.description} (${req.items[0]?.location})`;

  selectedTechParts = [];
  renderTechSelectedParts();

  const partSelect = document.getElementById('techPartSelect');
  partSelect.innerHTML = inventoryData.map(p => `<option value="${p.id}">${p.name} (คงเหลือ ${p.stock} ${p.unit})</option>`).join('');

  clearCanvas('techJobCanvas');
  openModal('techJobModal');
}

function techAddPartRow() {
  const partId = parseInt(document.getElementById('techPartSelect').value);
  const qty = parseInt(document.getElementById('techPartQty').value) || 1;
  const item = inventoryData.find(i => i.id === partId);
  if (!item) return;

  if (qty > item.stock) {
    alert(`อะไหล่ไม่เพียงพอ (คงเหลือ ${item.stock} ${item.unit})`);
    return;
  }

  selectedTechParts.push({ id: item.id, name: item.name, qty: qty, price: item.price, total: item.price * qty });
  renderTechSelectedParts();
}

function renderTechSelectedParts() {
  const tbody = document.getElementById('techSelectedPartsBody');
  tbody.innerHTML = '';
  selectedTechParts.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-1.5 text-center text-3xs">${i + 1}</td>
      <td class="p-1.5 text-3xs font-semibold">${p.name}</td>
      <td class="p-1.5 text-center text-3xs">${p.qty}</td>
      <td class="p-1.5 text-right text-3xs font-bold">${p.total} ฿</td>
      <td class="p-1.5 text-center"><button onclick="selectedTechParts.splice(${i}, 1); renderTechSelectedParts();" class="text-red-500 text-3xs">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function submitTechJobLog() {
  const req = repairRequests.find(r => r.id === currentTechJobRequestId);
  if (!req) return;

  const inspection = document.getElementById('techJobInspection').value.trim();
  if (!inspection) {
    alert('กรุณาระบุผลการตรวจสอบและวิธีแก้ไข');
    return;
  }

  // ตัดสต็อกอะไหล่จริง
  selectedTechParts.forEach(sp => {
    const inv = inventoryData.find(i => i.id === sp.id);
    if (inv) inv.stock = Math.max(0, inv.stock - sp.qty);
  });

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  req.status = 'WAITING_ACCEPTANCE';
  req.technicianAction = {
    technicianName: users.technician.name,
    inspectionAndParts: inspection,
    partsUsed: [...selectedTechParts],
    completedAt: now,
    signature: getCanvasData('techJobCanvas')
  };

  req.timeline.push({
    statusText: 'ช่างดำเนินการเสร็จสิ้น',
    timestamp: now,
    note: `ส่งมอบงานให้ผู้แจ้งตรวจรับ (${inspection})`
  });

  logNotification(`✅ ช่างซ่อมบำรุงปิดงาน [${req.id}] รอผู้แจ้งตรวจรับงาน`);
  closeModal('techJobModal');
  renderTechTasksTable();
  alert('บันทึกการซ่อมเรียบร้อย ส่งให้ผู้แจ้งตรวจรับงานแล้ว');
}

// ==========================================
// 8. USER ACCEPTANCE (ตรวจรับงาน)
// ==========================================
let currentAcceptanceRequestId = null;
function openAcceptanceModal(reqId) {
  currentAcceptanceRequestId = reqId;
  document.getElementById('acceptanceModalId').textContent = reqId;
  clearCanvas('userAcceptanceCanvas');
  openModal('acceptanceModal');
}

function submitUserAcceptance(isApproved) {
  const req = repairRequests.find(r => r.id === currentAcceptanceRequestId);
  if (!req) return;

  const feedback = document.getElementById('acceptanceFeedback').value.trim();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  req.status = isApproved ? 'COMPLETED' : 'REWORK';
  req.userAcceptance = {
    isAccepted: isApproved,
    feedback: feedback,
    rating: currentRating,
    acceptedAt: now,
    signature: getCanvasData('userAcceptanceCanvas')
  };

  req.timeline.push({
    statusText: isApproved ? 'ตรวจรับงานเรียบร้อย (ปิดงาน)' : 'ขอให้ดำเนินการใหม่ (ส่งแก้งาน)',
    timestamp: now,
    note: feedback || (isApproved ? 'งานเรียบร้อยสมบูรณ์' : 'ไม่ผ่านการตรวจรับ')
  });

  logNotification(`📝 ผู้แจ้งทำการตรวจรับใบงาน [${req.id}]: ${isApproved ? 'เรียบร้อยดี' : 'ขอให้แก้ไขใหม่'}`);
  closeModal('acceptanceModal');
  renderUserHistory();
  alert(isApproved ? 'ตรวจรับงานเรียบร้อย ปิดใบงานซ่อมสำเร็จ' : 'ส่งคำขอแก้ไขกลับไปยังช่างแล้ว');
}

function initRatingStars() {
  const stars = document.querySelectorAll('#acceptanceRatingContainer i');
  stars.forEach(star => {
    star.addEventListener('click', (e) => {
      currentRating = parseInt(e.target.dataset.rating);
      stars.forEach((s, idx) => {
        if (idx < currentRating) {
          s.className = 'fas fa-star text-amber-500 cursor-pointer text-2xl';
        } else {
          s.className = 'far fa-star text-slate-300 cursor-pointer text-2xl';
        }
      });
    });
  });
}

// ==========================================
// 9. INVENTORY MANAGEMENT
// ==========================================
function renderInventoryTable() {
  const tbody = document.getElementById('adminInventoryTableBody');
  tbody.innerHTML = '';

  inventoryData.forEach((item, index) => {
    const isLow = item.stock <= item.min;
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    tr.innerHTML = `
      <td class="py-3 px-4 text-xs font-semibold text-center text-slate-500">${index + 1}</td>
      <td class="py-3 px-4 text-xs font-bold text-slate-800">
        ${item.name}
        ${isLow ? '<span class="ml-1.5 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">สต็อกต่ำ</span>' : ''}
      </td>
      <td class="py-3 px-4 text-xs text-center font-black ${isLow ? 'text-red-600' : 'text-slate-700'}">${item.stock} ${item.unit}</td>
      <td class="py-3 px-4 text-xs text-center text-slate-500">${item.min} ${item.unit}</td>
      <td class="py-3 px-4 text-xs text-right font-bold text-slate-700">${item.price} ฿</td>
      <td class="py-3 px-4 text-center">
        <button onclick="openInventoryAdjustModal(${item.id})" class="text-blue-900 hover:text-blue-700 text-xs font-semibold"><i class="fas fa-edit"></i> แก้ไข</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

let currentAdjustItemId = null;
function openInventoryAdjustModal(itemId) {
  currentAdjustItemId = itemId;
  const item = inventoryData.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById('inventoryAdjustName').textContent = item.name;
  document.getElementById('inventoryAdjustInput').value = item.stock;
  document.getElementById('inventoryAdjustMinInput').value = item.min;
  document.getElementById('inventoryAdjustPriceInput').value = item.price;
  openModal('inventoryAdjustModal');
}

function submitInventoryAdjustment() {
  const item = inventoryData.find(i => i.id === currentAdjustItemId);
  if (!item) return;

  item.stock = parseInt(document.getElementById('inventoryAdjustInput').value) || 0;
  item.min = parseInt(document.getElementById('inventoryAdjustMinInput').value) || 0;
  item.price = parseFloat(document.getElementById('inventoryAdjustPriceInput').value) || 0;

  closeModal('inventoryAdjustModal');
  renderInventoryTable();
}

function openInventoryAddNewModal() {
  document.getElementById('newInventoryName').value = '';
  document.getElementById('newInventoryUnit').value = '';
  document.getElementById('newInventoryPrice').value = '';
  document.getElementById('newInventoryStock').value = '';
  document.getElementById('newInventoryMin').value = '';
  openModal('inventoryAddNewModal');
}

function submitInventoryAddNew() {
  const name = document.getElementById('newInventoryName').value.trim();
  const unit = document.getElementById('newInventoryUnit').value.trim() || 'ชิ้น';
  const price = parseFloat(document.getElementById('newInventoryPrice').value) || 0;
  const stock = parseInt(document.getElementById('newInventoryStock').value) || 0;
  const min = parseInt(document.getElementById('newInventoryMin').value) || 0;

  if (!name) {
    alert('กรุณากรอกชื่อรายการอะไหล่');
    return;
  }

  inventoryData.push({ id: Date.now(), name, unit, price, stock, min });
  closeModal('inventoryAddNewModal');
  renderInventoryTable();
}

// ==========================================
// 10. QR SCAN SIMULATOR
// ==========================================
document.getElementById('btnScanQR').addEventListener('click', () => openModal('qrModal'));

function simulateScanQR(code) {
  const qrMap = {
    'QR-001': 'อาคาร 1 ชั้น 2 ห้องคอมพิวเตอร์ 101',
    'QR-002': 'อาคาร 2 ชั้น 3 ห้องเรียนวิชาการ 302',
    'QR-003': 'หอประชุมใหญ่ ชั้น 1 สหกรณ์โรงเรียน',
    'QR-004': 'อาคารอำนวยการ ชั้น 1 ห้องปกครอง'
  };

  const loc = qrMap[code] || 'อาคาร 1';
  switchRole('user');
  showScreen('eformScreen');

  const tbody = document.getElementById('eformTableBody');
  if (tbody.rows.length === 1 && !tbody.rows[0].querySelector('.eform-item-desc').value) {
    tbody.rows[0].querySelector('.eform-item-loc').value = loc;
  } else {
    addEFormRow('', loc);
  }

  closeModal('qrModal');
  alert(`สแกน QR สำเร็จ! ระบุสถานที่: "${loc}"`);
}

// ==========================================
// 11. DETAIL MODAL & PRINT VIEW
// ==========================================
function openDetailModal(reqId) {
  const req = repairRequests.find(r => r.id === reqId);
  if (!req) return;

  document.getElementById('detailModalId').textContent = req.id;
  document.getElementById('detailReporter').textContent = req.requesterName;
  document.getElementById('detailCreatedDate').textContent = req.createdDate;
  document.getElementById('detailUrgency').textContent = req.urgency === 'urgent' ? 'ด่วนมาก 🔴' : 'ปกติ';
  document.getElementById('detailTech').textContent = req.adminApproval?.assignedTech || 'ยังไม่ระบุ';

  // Items table
  const tbody = document.getElementById('detailItemsBody');
  tbody.innerHTML = req.items.map((item, i) => `
    <tr class="border-b">
      <td class="py-2 px-3 text-center">${i + 1}</td>
      <td class="py-2 px-3 font-semibold">${item.description}</td>
      <td class="py-2 px-3 text-slate-500">${item.location}</td>
    </tr>
  `).join('');

  // Stepper
  const stepper = document.getElementById('detailStepper');
  stepper.innerHTML = `
    <div class="flex justify-between items-center text-[11px] font-bold">
      <span class="${['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_ACCEPTANCE', 'COMPLETED'].includes(req.status) ? 'text-brand-900' : 'text-slate-300'}">1. แจ้งซ่อม</span>
      <span class="${['ASSIGNED', 'IN_PROGRESS', 'WAITING_ACCEPTANCE', 'COMPLETED'].includes(req.status) ? 'text-brand-900' : 'text-slate-300'}">2. มอบหมายช่าง</span>
      <span class="${['IN_PROGRESS', 'WAITING_ACCEPTANCE', 'COMPLETED'].includes(req.status) ? 'text-brand-900' : 'text-slate-300'}">3. กำลังซ่อม</span>
      <span class="${['WAITING_ACCEPTANCE', 'COMPLETED'].includes(req.status) ? 'text-brand-900' : 'text-slate-300'}">4. ตรวจรับงาน</span>
      <span class="${req.status === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-300'}">5. ปิดงาน</span>
    </div>
  `;

  // Timeline
  const timeline = document.getElementById('detailTimeline');
  timeline.innerHTML = req.timeline.map(t => `
    <li class="mb-3 ml-2">
      <span class="absolute -left-1.5 mt-1.5 w-3 h-3 bg-blue-900 rounded-full border border-white"></span>
      <h5 class="text-xs font-bold text-slate-800">${t.statusText}</h5>
      <p class="text-[11px] text-slate-500">${t.note}</p>
      <span class="text-[10px] text-slate-400 font-mono">${t.timestamp}</span>
    </li>
  `).join('');

  openModal('detailModal');
}

function printDraftPaper(reqId) {
  const req = repairRequests.find(r => r.id === reqId);
  if (!req) return;

  const printContainer = document.getElementById('printFormTemplate');
  printContainer.innerHTML = `
    <div class="print-page">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
        <h2 style="font-size: 18px; font-weight: bold; margin: 0;">วิทยาลัยเทคโนโลยีพระมหาไถ่ พัทยา</h2>
        <h3 style="font-size: 16px; font-weight: bold; margin: 5px 0;">แบบรายงานการแจ้งซ่อม</h3>
        <p style="text-align: right; font-size: 12px; margin: 0;">วันที่ ${req.createdDate}</p>
      </div>

      <p style="margin-bottom: 8px;"><strong>เรียน:</strong> หัวหน้าฝ่ายอาคารสถานที่</p>
      <p style="margin-bottom: 12px;"><strong>ข้าพเจ้า:</strong> ${req.requesterName} &nbsp;&nbsp; <strong>ตำแหน่ง:</strong> ${req.position} &nbsp;&nbsp; <strong>ฝ่าย:</strong> ${req.department}</p>
      <p style="margin-bottom: 8px;">ขอแจ้งซ่อมดังต่อไปนี้:</p>

      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">ที่</th>
            <th>รายการ (สิ่งที่ซ่อม / อาการเสีย)</th>
            <th style="width: 40%;">สถานที่</th>
          </tr>
        </thead>
        <tbody>
          ${req.items.map((it, idx) => `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td>${it.description}</td>
              <td>${it.location}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 20px; border-top: 1px solid #000; padding-top: 10px;">
        <p><strong>การรับทราบ:</strong> หัวหน้าฝ่ายบริหารทรัพยากร: ${req.adminApproval?.adminName || '...........................................'}</p>
        <p><strong>ช่างผู้รับผิดชอบ:</strong> ${req.adminApproval?.assignedTech || '...........................................'}</p>
      </div>

      <div style="margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px;">
        <p><strong>การตรวจสอบและอะไหล่ที่ใช้ (สำหรับช่าง):</strong></p>
        <p>${req.technicianAction?.inspectionAndParts || '.....................................................................................................................................'}</p>
      </div>

      <div style="margin-top: 15px; border-top: 1px solid #000; padding-top: 10px;">
        <p><strong>ผลการตรวจรับงาน:</strong> [ ${req.userAcceptance?.isAccepted ? '✓' : ' '} ] เรียบร้อยดี &nbsp;&nbsp;&nbsp; [ ${req.userAcceptance && !req.userAcceptance.isAccepted ? '✓' : ' '} ] ยังไม่เรียบร้อย</p>
        <p style="text-align: right; margin-top: 20px;">ลงชื่อผู้แจ้งซ่อม: ${req.requesterName}</p>
      </div>
    </div>
  `;

  window.print();
}

// ==========================================
// 12. UTILITY & CANVAS HELPERS
// ==========================================
function getStatusBadge(status) {
  switch (status) {
    case 'PENDING':
      return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">รอรับเรื่อง</span>';
    case 'ASSIGNED':
    case 'IN_PROGRESS':
      return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-brand-900">กำลังดำเนินการ</span>';
    case 'WAITING_ACCEPTANCE':
      return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">รอตรวจรับงาน</span>';
    case 'COMPLETED':
      return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">ปิดงานแล้ว</span>';
    case 'REWORK':
      return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">ส่งแก้งาน</span>';
    default:
      return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">-</span>';
  }
}

function initSignatureCanvases() {
  ['adminAssignCanvas', 'techJobCanvas', 'userAcceptanceCanvas'].forEach(id => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let painting = false;

    canvas.width = canvas.parentElement.clientWidth || 350;
    canvas.height = 110;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';

    canvas.addEventListener('mousedown', () => painting = true);
    canvas.addEventListener('mouseup', () => { painting = false; ctx.beginPath(); });
    canvas.addEventListener('mousemove', draw);

    canvas.addEventListener('touchstart', (e) => { painting = true; drawTouch(e); });
    canvas.addEventListener('touchend', () => { painting = false; ctx.beginPath(); });
    canvas.addEventListener('touchmove', drawTouch);

    function draw(e) {
      if (!painting) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }

    function drawTouch(e) {
      if (!painting) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    }

    const clearBtn = canvas.parentElement.previousElementSibling?.querySelector('.btn-clear-sig');
    if (clearBtn) clearBtn.addEventListener('click', () => clearCanvas(id));
  });
}

function clearCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getCanvasData(canvasId) {
  const canvas = document.getElementById(canvasId);
  return canvas ? canvas.toDataURL() : null;
}

function initModalsClose() {
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-container').classList.add('hidden');
    });
  });

  document.getElementById('toggleNotifBtn').addEventListener('click', () => {
    document.getElementById('notifPanel').classList.remove('translate-x-full');
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function logNotification(msg) {
  const container = document.getElementById('notifLogsContainer');
  const now = new Date().toTimeString().split(' ')[0];
  const item = document.createElement('div');
  item.className = 'bg-slate-800 p-2.5 rounded text-xs border border-slate-700 text-slate-200';
  item.innerHTML = `<span class="text-[10px] text-green-400 block font-mono">${now}</span>${msg}`;
  container.prepend(item);
}