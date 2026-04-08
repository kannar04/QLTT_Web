/* ============================================================
   STUDYHOME LMS ??" INTERACTIVE MOCK PLATFORM
   ============================================================ */

function padNumber(n, len) {
  return String(n).padStart(len, '0');
}

function formatDateVN(date) {
  return padNumber(date.getDate(), 2) + '/' + padNumber(date.getMonth() + 1, 2) + '/' + date.getFullYear();
}

function formatDateTimeVN(date, timeText) {
  return formatDateVN(date) + ' ' + (timeText || (padNumber(date.getHours(), 2) + ':' + padNumber(date.getMinutes(), 2)));
}

function getTimetableYear() {
  return 2026;
}

function getTimetableWeekCount() {
  const year = getTimetableYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const days = Math.floor((end - start) / 86400000) + 1;
  return Math.ceil(days / 7);
}

function getTimetableCurrentWeek() {
  const year = getTimetableYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  const now = new Date();
  const ref = now < start ? start : (now > end ? end : now);
  const dayOfYear = Math.floor((ref - start) / 86400000) + 1;
  return Math.max(1, Math.min(getTimetableWeekCount(), Math.floor((dayOfYear - 1) / 7) + 1));
}

function getTimetableWeekStart(weekNumber) {
  const year = getTimetableYear();
  const start = new Date(year, 0, 1);
  start.setDate(start.getDate() + ((weekNumber - 1) * 7));
  return start;
}

function getTimetableWeekDays(weekNumber) {
  const start = getTimetableWeekStart(weekNumber);
  const days = [];
  let i;
  for (i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    days.push(date);
  }
  return days;
}

function shiftStudentWeek(delta) {
  const weekCount = getTimetableWeekCount();
  if (!state.selectedStudentWeek || state.selectedStudentWeek < 1 || state.selectedStudentWeek > weekCount) {
    state.selectedStudentWeek = getTimetableCurrentWeek();
  }
  state.selectedStudentWeek = Math.max(1, Math.min(weekCount, state.selectedStudentWeek + delta));
  renderStudentDashboardWidgets();
}

function shiftStudentCalendarMonth(delta) {
  const now = new Date();
  let year = state.selectedStudentCalendarYear;
  let month = state.selectedStudentCalendarMonth;
  if (year === null || month === null) {
    year = now.getFullYear();
    month = now.getMonth();
  }
  month += delta;
  while (month < 0) {
    month += 12;
    year -= 1;
  }
  while (month > 11) {
    month -= 12;
    year += 1;
  }
  state.selectedStudentCalendarYear = year;
  state.selectedStudentCalendarMonth = month;
  renderStudentDashboardMonthCalendar();
}

function shiftTeacherCalendarMonth(delta) {
  const now = new Date();
  let year = state.teacherCalendarYear;
  let month = state.teacherCalendarMonth;
  if (year === null || month === null) {
    year = now.getFullYear();
    month = now.getMonth();
  }
  month += delta;
  while (month < 0) {
    month += 12;
    year -= 1;
  }
  while (month > 11) {
    month -= 12;
    year += 1;
  }
  state.teacherCalendarYear = year;
  state.teacherCalendarMonth = month;
  renderSideCalendars();
}

function getClassScheduleDays(c) {
  const raw = (c && (c.schedulePattern || c.dayPattern || c.schedule || c.dayOfWeek || '')).toString();
  const head = raw.split(' ')[0];
  return head.split('-').filter(Boolean);
}

function getClassSessionSlot(c) {
  if (c && Number(c.sessionSlot) === 1) {
    return 1;
  }
  if (c && Number(c.sessionSlot) === 2) {
    return 2;
  }
  const startTime = (c && c.startTime) ? String(c.startTime) : '';
  if (startTime >= '19:30') {
    return 2;
  }
  return 1;
}

function getStudentTimetableWeekLabel(weekNumber) {
  const days = getTimetableWeekDays(weekNumber);
  return 'Tuần ' + weekNumber + ' (' + formatDateVN(days[0]) + ' - ' + formatDateVN(days[6]) + ')';
}

function buildMockDatabase() {
  const subjects = [
    { key: 'MATH', name: 'Toán' },
    { key: 'PHYS', name: 'Vật lí' },
    { key: 'CHEM', name: 'Hóa học' },
    { key: 'LIT', name: 'Ngữ văn' },
    { key: 'ENG', name: 'Tiếng Anh' }
  ];
  const levels = ['Cơ bản', 'Nâng cao'];
  const classCodes = [];
  const classes = [];
  const accounts = [];
  const materials = {};
  const homeworks = {};
  const absences = [];
  const leaveRequests = [];
  const tuition = [];
  const invoices = [];
  const notifications = [];
  const submissions = [];
  const examSchedules = [];
  const teacherMaterials = [
    { id: 'DOC001', title: 'Đề cương ôn tập Toán HK1', classCode: 'L01', teacherId: 'GV001', uploadedAt: '2026-03-01T08:00:00' },
    { id: 'DOC002', title: 'Bài tập Vật lí chương 3', classCode: 'L02', teacherId: 'GV002', uploadedAt: '2026-03-05T09:30:00' }
  ];
  const sentNotifications = [];
  const grades = [];
  const revenues = [];
  const subjectClassMap = {};

  let i;
  let classIndex = 1;
  for (i = 0; i < subjects.length; i++) {
    let lv;
    for (lv = 0; lv < levels.length; lv++) {
      const classCode = 'L' + padNumber(classIndex, 2);
      const isChemistry = subjects[i].key === 'CHEM';
      const isMorningPattern = lv === 0;
      const schedulePattern = isChemistry ? 'T2-T4-T6' : (isMorningPattern ? 'T2-T4-T6' : 'T3-T5-T7');
      const startTime = isChemistry ? '19:30' : (isMorningPattern ? '17:45' : '19:30');
      const endTime = isChemistry ? '21:00' : (isMorningPattern ? '19:15' : '21:00');
      const sessionSlot = isChemistry ? 2 : (isMorningPattern ? 1 : 2);
      classCodes.push(classCode);
      classes.push({
        code: classCode,
        subject: subjects[i].name,
        level: levels[lv],
        name: subjects[i].name + ' - ' + levels[lv],
        capacity: 32,
        room: 'P.' + (200 + classIndex),
        schedule: schedulePattern + ' ' + startTime,
        schedulePattern: schedulePattern,
        sessionSlot: sessionSlot,
        startTime: startTime,
        endTime: endTime,
        teacher: 'GV' + padNumber(classIndex, 3),
        studentIds: []
      });
      if (!subjectClassMap[subjects[i].name]) {
        subjectClassMap[subjects[i].name] = [];
      }
      subjectClassMap[subjects[i].name].push(classCode);
      classIndex += 1;
    }
  }

  for (i = 1; i <= 10; i++) {
    accounts.push({
      id: 'NV' + padNumber(i, 3),
      password: '111111',
      role: 'staff',
      name: 'Nhan vien ' + i,
      birthYear: 1988 + (i % 8),
      gender: i % 2 === 0 ? 'Nu' : 'Nam',
      classCode: '',
      phone: '0901' + padNumber(i, 6)
    });
  }

  for (i = 1; i <= 20; i++) {
    const subjectName = subjects[(i - 1) % subjects.length].name;
    const subjectCodes = subjectClassMap[subjectName] || [classCodes[0]];
    accounts.push({
      id: 'GV' + padNumber(i, 3),
      password: '111111',
      role: 'teacher',
      name: 'Giao vien ' + i,
      birthYear: 1979 + (i % 17),
      gender: i % 2 === 0 ? 'Nu' : 'Nam',
      subject: subjectName,
      classCodes: subjectCodes,
      classCode: subjectCodes[Math.floor((i - 1) / subjects.length) % subjectCodes.length],
      phone: '0902' + padNumber(i, 6)
    });
  }

  for (i = 0; i < classes.length; i++) {
    classes[i].teacher = 'GV' + padNumber((subjects.map(function (s) { return s.name; }).indexOf(classes[i].subject) + 1), 3);
  }

  for (i = 1; i <= 60; i++) {
    const sid = 'HV' + padNumber(i, 3);
    const subjectCodes = [];
    let s;
    for (s = 0; s < subjects.length; s++) {
      const code = classes[(s * 2) + ((i + s) % 2)].code;
      subjectCodes.push(code);
    }
    const classCode = subjectCodes[0];
    accounts.push({
      id: sid,
      password: '111111',
      role: 'student',
      name: 'Hoc vien ' + i,
      birthYear: 2006 + (i % 6),
      gender: i % 2 === 0 ? 'Nu' : 'Nam',
      classCode: classCode,
      subjectCodes: subjectCodes,
      phone: '0903' + padNumber(i, 6)
    });

    let c;
    for (c = 0; c < classes.length; c++) {
      if (subjectCodes.indexOf(classes[c].code) >= 0) {
        classes[c].studentIds.push(sid);
      }
    }
  }

  let hwCounter = 1;
  let materialCounter = 1;
  let revenueCounter = 1;

  for (i = 0; i < classCodes.length; i++) {
    const code = classCodes[i];
    materials[code] = [];
    homeworks[code] = [];

    let j;
    for (j = 1; j <= 3; j++) {
      materials[code].push({
        id: 'M' + padNumber(materialCounter, 4),
        session: 'Bộ tài liệu ' + j,
        title: classes[i].subject + ' ' + classes[i].level + ' - Unit ' + j + '.pdf'
      });
      materialCounter += 1;
    }

    for (j = 1; j <= 6; j++) {
      homeworks[code].push({
        id: 'HW' + padNumber(hwCounter, 4),
        title: classes[i].subject + ' - Bài tập ' + j,
        open: '2026-' + padNumber(((j + i) % 12) + 1, 2) + '-' + padNumber(((j * 2) % 26) + 1, 2),
        due: '2026-' + padNumber(((j + i) % 12) + 1, 2) + '-' + padNumber(((j * 2) % 26) + 3, 2),
        content: 'Hoàn thành bài tập tổng hợp môn ' + classes[i].subject + ', phần ' + j + ' (' + classes[i].level + ').'
      });
      hwCounter += 1;
    }

    for (j = 1; j <= 6; j++) {
      revenues.push({
        id: 'REV' + padNumber(revenueCounter, 4),
        classCode: code,
        month: '2026-' + padNumber(j, 2),
        students: classes[i].studentIds.length,
        amount: 18000000 + (i * 650000) + (j * 420000),
        subject: classes[i].subject
      });
      revenueCounter += 1;
    }
  }

  let tuitionCounter = 1;
  let invoiceCounter = 1;
  let gradeCounter = 1;
  let notifCounter = 1;
  let absenceCounter = 1;

  for (i = 1; i <= 60; i++) {
    const sid = 'HV' + padNumber(i, 3);
    const student = accounts[30 + (i - 1)];
    const subjectCodes = student.subjectCodes || [student.classCode];
    const due = 3200000 + ((i % 5) * 120000);
    const debt = (i % 3 === 0 || i === 1) ? 600000 : 0;
    const paid = due - debt;

    let s;
    for (s = 0; s < subjectCodes.length; s++) {
      const code = subjectCodes[s];
      tuition.push({
        id: 'P' + padNumber(tuitionCounter, 4),
        studentId: sid,
        feeCode: 'HP-' + code + '-' + padNumber(i, 3),
        amountDue: due,
        paid: paid,
        offset: 0,
        discount: i % 7 === 0 ? 200000 : 0,
        debt: debt,
        paidDate: '2026-' + padNumber((i % 12) + 1, 2) + '-' + padNumber((i % 27) + 1, 2),
        method: i % 2 === 0 ? 'Chuyển khoản' : 'MoMo',
        note: 'Học phí môn ' + getClassByCodeLocal(code).subject
      });

      invoices.push({
        id: 'HD' + padNumber(invoiceCounter, 5),
        studentId: sid,
        classCode: code,
        totalAmount: due - (i % 7 === 0 ? 200000 : 0),
        discount: i % 7 === 0 ? 200000 : 0,
        status: debt > 0 ? 'unpaid' : 'paid',
        dueDate: '2026-' + padNumber(((i + s) % 12) + 1, 2) + '-' + padNumber(((i + s) % 25) + 1, 2),
        paidDate: debt > 0 ? '' : '2026-' + padNumber((i % 12) + 1, 2) + '-' + padNumber((i % 27) + 1, 2),
        method: debt > 0 ? '' : (i % 2 === 0 ? 'Chuyển khoản' : 'Tiền mặt'),
        note: 'Học phí môn ' + getClassByCodeLocal(code).subject
      });
      invoiceCounter += 1;
      tuitionCounter += 1;

      grades.push({
        id: 'GR' + padNumber(gradeCounter, 4),
        studentId: sid,
        classCode: code,
        subject: getClassByCodeLocal(code).subject,
        score1: 6 + ((i + s) % 4),
        score2: 5 + ((i + s) % 5),
        score3: 7 + ((i + s) % 3),
        average: Number(((6 + ((i + s) % 4) + 5 + ((i + s) % 5) + 7 + ((i + s) % 3)) / 3).toFixed(2))
      });
      gradeCounter += 1;
    }

    notifications.push({
      id: 'N' + padNumber(notifCounter, 4),
      audience: sid,
      to: sid,
      text: 'Thông báo học tập mới cho 5 môn học trong tuần.',
      title: 'Thông báo học tập',
      body: 'Thông báo học tập mới cho 5 môn học trong tuần.',
      type: 'GENERAL',
      timestamp: '2026-04-' + padNumber((i % 28) + 1, 2) + 'T09:' + padNumber((i * 3) % 60, 2) + ':00',
      time: '2026-04-' + padNumber((i % 28) + 1, 2) + ' 09:' + padNumber((i * 3) % 60, 2),
      read: false
    });
    notifCounter += 1;

    if (i <= 25) {
      absences.push({
        id: 'ABS' + padNumber(absenceCounter, 4),
        studentId: sid,
        date: '2026-03-' + padNumber((i % 28) + 1, 2),
        reason: i % 2 === 0 ? 'Viec gia dinh' : 'Suc khoe',
        description: 'Don nghi hoc auto-generated #' + i,
        status: i % 3 === 0 ? 'Chờ duyệt' : 'Đã duyệt'
      });
      absenceCounter += 1;

      leaveRequests.push({
        id: 'LR' + padNumber(absenceCounter, 4),
        studentId: sid,
        classCode: student.classCode,
        date: '2026-03-' + padNumber((i % 28) + 1, 2),
        reason: i % 2 === 0 ? 'Việc gia đình' : 'Sức khỏe',
        status: i % 3 === 0 ? 'pending' : 'approved',
        rejectReason: ''
      });
    }

    examSchedules.push({
      id: 'EX' + padNumber(i, 4) + 'A',
      studentId: sid,
      subject: 'Toán',
      examDate: '2026-05-15',
      session: 'Ca 1 (07:30)',
      room: 'P.301',
      seatNumber: 'SBD' + sid.slice(-3),
      result: i % 2 === 0 ? (7 + (i % 3)) : ''
    });
    examSchedules.push({
      id: 'EX' + padNumber(i, 4) + 'B',
      studentId: sid,
      subject: 'Tiếng Anh',
      examDate: '2026-05-20',
      session: 'Ca 2 (13:30)',
      room: 'P.204',
      seatNumber: 'SBD' + sid.slice(-3),
      result: ''
    });
    examSchedules.push({
      id: 'EX' + padNumber(i, 4) + 'C',
      studentId: sid,
      subject: 'Vật lí',
      examDate: '2026-05-25',
      session: 'Ca 1 (07:30)',
      room: 'P.305',
      seatNumber: 'SBD' + sid.slice(-3),
      result: ''
    });
  }

  for (i = 1; i <= 5; i++) {
    notifications.push({
      id: 'N' + padNumber(notifCounter, 4),
      audience: 'all-staff',
      to: 'all-staff',
      text: 'Tổng hợp doanh thu tháng ' + padNumber(i, 2) + '/2026 đã sẵn sàng.',
      title: 'Báo cáo doanh thu',
      body: 'Tổng hợp doanh thu tháng ' + padNumber(i, 2) + '/2026 đã sẵn sàng.',
      type: 'SYSTEM',
      timestamp: '2026-' + padNumber(i, 2) + '-28T16:30:00',
      time: '2026-' + padNumber(i, 2) + '-28 16:30',
      read: false
    });
    notifCounter += 1;
  }

  function getClassByCodeLocal(code) {
    let x;
    for (x = 0; x < classes.length; x++) {
      if (classes[x].code === code) {
        return classes[x];
      }
    }
    return { subject: 'Tong hop' };
  }

  let tm;
  for (tm = 0; tm < teacherMaterials.length; tm++) {
    const doc = teacherMaterials[tm];
    if (!materials[doc.classCode]) {
      materials[doc.classCode] = [];
    }
    materials[doc.classCode].unshift({
      id: doc.id,
      title: doc.title,
      session: 'Tài liệu giáo viên',
      fileName: '',
      classCode: doc.classCode,
      teacherId: doc.teacherId,
      uploadedAt: doc.uploadedAt
    });
  }

  return {
    subjects: subjects,
    accounts: accounts,
    classes: classes,
    materials: materials,
    homeworks: homeworks,
    absences: absences,
    leaveRequests: leaveRequests,
    tuition: tuition,
    invoices: invoices,
    notifications: notifications,
    submissions: submissions,
    examSchedules: examSchedules,
    teacherMaterials: teacherMaterials,
    sentNotifications: sentNotifications,
    comboDiscountRate: 0.1,
    grades: grades,
    revenues: revenues,
    auditLogs: []
  };
}

const db = buildMockDatabase();

const state = {
  currentUserId: '',
  selectedAccountId: 'HV001',
  selectedClassCode: 'L01',
  selectedHomeworkId: 'HW001',
  selectedStudentWeek: null,
  selectedStudentCalendarYear: null,
  selectedStudentCalendarMonth: null,
  selectedStudentCalendarDate: '',
  teacherCalendarYear: null,
  teacherCalendarMonth: null,
  selectedLeaveApprovalTab: 'pending',
  selectedInvoiceFilter: 'all',
  selectedInvoiceId: '',
  selectedPaymentMethod: '',
  selectedTuitionInvoiceId: '',
  studentNotificationFilter: 'all',
  teacherNotificationFilter: 'all',
  editAccountFromProfile: false,
  profileEditing: false,
  scheduleConflictChecked: false,
  teacherGradeLocked: false,
  teacherGradeWeights: [34, 33, 33],
  activeModalId: '',
  lastFocusedElement: null,
  screenHistory: [],
  reducedMotion: false,
  quickSearchOpen: false,
  shortcutHelpOpen: false,
  restoreTargetScreen: '',
  lastScreenId: 's-landing',
  autosaveEnabled: true
};

const APP_SNAPSHOT_VERSION = 3;
const APP_SNAPSHOT_KEY = 'studyhome-app-snapshot-v3';
const APP_DRAFT_PREFIX = 'studyhome-draft-';
const APP_DRAFT_FIELDS = [
  'notifyTitle',
  'notifyBody',
  'hwTitle',
  'hwDesc',
  'teacherDocTitle',
  'teacherDocDesc',
  'absenceReason',
  'absenceDescription'
];
const QUICK_SEARCH_LIMIT = 8;

let appSnapshotTimer = 0;
let appAutosaveHeartbeat = 0;
let screenLoadingHideTimer = 0;
let toastQueue = [];
let toastActive = false;

function byId(id) {
  return document.getElementById(id);
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' VND';
}

function getEmptyStateCardHtml(title, description, actionLabel, actionHandler) {
  let actionHtml = '';
  if (actionLabel && actionHandler) {
    actionHtml = '<div class="empty-state-action"><button class="btn btn-outline btn-xs" type="button" data-inline-action="' + actionHandler + '">' + actionLabel + '</button></div>';
  }
  return '<div class="empty-state-card"><div class="empty-state-title">' + (title || 'Chưa có dữ liệu') + '</div><div class="empty-state-desc">' + (description || 'Dữ liệu sẽ xuất hiện khi có phát sinh.') + '</div>' + actionHtml + '</div>';
}

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}

function cloneData(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (e) {
    return value;
  }
}

function getPersistedStateSnapshot() {
  const activeScreenId = typeof getActiveScreenId === 'function' ? (getActiveScreenId() || '') : '';
  return {
    currentUserId: state.currentUserId,
    selectedAccountId: state.selectedAccountId,
    selectedClassCode: state.selectedClassCode,
    selectedHomeworkId: state.selectedHomeworkId,
    selectedStudentWeek: state.selectedStudentWeek,
    selectedStudentCalendarYear: state.selectedStudentCalendarYear,
    selectedStudentCalendarMonth: state.selectedStudentCalendarMonth,
    selectedStudentCalendarDate: state.selectedStudentCalendarDate,
    teacherCalendarYear: state.teacherCalendarYear,
    teacherCalendarMonth: state.teacherCalendarMonth,
    selectedLeaveApprovalTab: state.selectedLeaveApprovalTab,
    selectedInvoiceFilter: state.selectedInvoiceFilter,
    selectedInvoiceId: state.selectedInvoiceId,
    selectedPaymentMethod: state.selectedPaymentMethod,
    selectedTuitionInvoiceId: state.selectedTuitionInvoiceId,
    studentNotificationFilter: state.studentNotificationFilter,
    teacherNotificationFilter: state.teacherNotificationFilter,
    teacherGradeLocked: state.teacherGradeLocked,
    teacherGradeWeights: cloneData(state.teacherGradeWeights),
    reducedMotion: !!state.reducedMotion,
    screenHistory: cloneData(state.screenHistory),
    lastScreenId: activeScreenId || state.lastScreenId || 's-landing'
  };
}

function applyPersistedStateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return;
  }
  if (typeof snapshot.currentUserId === 'string') {
    state.currentUserId = snapshot.currentUserId;
  }
  if (typeof snapshot.selectedAccountId === 'string') {
    state.selectedAccountId = snapshot.selectedAccountId;
  }
  if (typeof snapshot.selectedClassCode === 'string') {
    state.selectedClassCode = snapshot.selectedClassCode;
  }
  if (typeof snapshot.selectedHomeworkId === 'string') {
    state.selectedHomeworkId = snapshot.selectedHomeworkId;
  }
  if (typeof snapshot.selectedStudentWeek === 'number') {
    state.selectedStudentWeek = snapshot.selectedStudentWeek;
  }
  if (typeof snapshot.selectedStudentCalendarYear === 'number') {
    state.selectedStudentCalendarYear = snapshot.selectedStudentCalendarYear;
  }
  if (typeof snapshot.selectedStudentCalendarMonth === 'number') {
    state.selectedStudentCalendarMonth = snapshot.selectedStudentCalendarMonth;
  }
  if (typeof snapshot.selectedStudentCalendarDate === 'string') {
    state.selectedStudentCalendarDate = snapshot.selectedStudentCalendarDate;
  }
  if (typeof snapshot.teacherCalendarYear === 'number') {
    state.teacherCalendarYear = snapshot.teacherCalendarYear;
  }
  if (typeof snapshot.teacherCalendarMonth === 'number') {
    state.teacherCalendarMonth = snapshot.teacherCalendarMonth;
  }
  if (typeof snapshot.selectedLeaveApprovalTab === 'string') {
    state.selectedLeaveApprovalTab = snapshot.selectedLeaveApprovalTab;
  }
  if (typeof snapshot.selectedInvoiceFilter === 'string') {
    state.selectedInvoiceFilter = snapshot.selectedInvoiceFilter;
  }
  if (typeof snapshot.selectedInvoiceId === 'string') {
    state.selectedInvoiceId = snapshot.selectedInvoiceId;
  }
  if (typeof snapshot.selectedPaymentMethod === 'string') {
    state.selectedPaymentMethod = snapshot.selectedPaymentMethod;
  }
  if (typeof snapshot.selectedTuitionInvoiceId === 'string') {
    state.selectedTuitionInvoiceId = snapshot.selectedTuitionInvoiceId;
  }
  if (snapshot.studentNotificationFilter === 'all' || snapshot.studentNotificationFilter === 'unread') {
    state.studentNotificationFilter = snapshot.studentNotificationFilter;
  }
  if (snapshot.teacherNotificationFilter === 'all' || snapshot.teacherNotificationFilter === 'unread') {
    state.teacherNotificationFilter = snapshot.teacherNotificationFilter;
  }
  if (typeof snapshot.teacherGradeLocked === 'boolean') {
    state.teacherGradeLocked = snapshot.teacherGradeLocked;
  }
  if (Array.isArray(snapshot.teacherGradeWeights) && snapshot.teacherGradeWeights.length === 3) {
    state.teacherGradeWeights = [
      Number(snapshot.teacherGradeWeights[0]) || 34,
      Number(snapshot.teacherGradeWeights[1]) || 33,
      Number(snapshot.teacherGradeWeights[2]) || 33
    ];
  }
  state.reducedMotion = !!snapshot.reducedMotion;
  state.screenHistory = Array.isArray(snapshot.screenHistory) ? snapshot.screenHistory.slice(-120) : [];
  if (typeof snapshot.lastScreenId === 'string' && snapshot.lastScreenId) {
    state.restoreTargetScreen = snapshot.lastScreenId;
    state.lastScreenId = snapshot.lastScreenId;
  }
}

function getPersistedDbSnapshot() {
  return {
    accounts: cloneData(db.accounts),
    classes: cloneData(db.classes),
    materials: cloneData(db.materials),
    homeworks: cloneData(db.homeworks),
    absences: cloneData(db.absences),
    leaveRequests: cloneData(db.leaveRequests),
    invoices: cloneData(db.invoices),
    notifications: cloneData(db.notifications),
    submissions: cloneData(db.submissions),
    teacherMaterials: cloneData(db.teacherMaterials),
    sentNotifications: cloneData(db.sentNotifications),
    grades: cloneData(db.grades),
    revenues: cloneData(db.revenues),
    comboDiscountRate: db.comboDiscountRate,
    auditLogs: cloneData(db.auditLogs || [])
  };
}

function applyPersistedDbSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return;
  }
  if (Array.isArray(snapshot.accounts)) {
    db.accounts = cloneData(snapshot.accounts);
  }
  if (Array.isArray(snapshot.classes)) {
    db.classes = cloneData(snapshot.classes);
  }
  if (snapshot.materials && typeof snapshot.materials === 'object') {
    db.materials = cloneData(snapshot.materials);
  }
  if (snapshot.homeworks && typeof snapshot.homeworks === 'object') {
    db.homeworks = cloneData(snapshot.homeworks);
  }
  if (Array.isArray(snapshot.absences)) {
    db.absences = cloneData(snapshot.absences);
  }
  if (Array.isArray(snapshot.leaveRequests)) {
    db.leaveRequests = cloneData(snapshot.leaveRequests);
  }
  if (Array.isArray(snapshot.invoices)) {
    db.invoices = cloneData(snapshot.invoices);
  }
  if (Array.isArray(snapshot.notifications)) {
    db.notifications = cloneData(snapshot.notifications);
  }
  if (Array.isArray(snapshot.submissions)) {
    db.submissions = cloneData(snapshot.submissions);
  }
  if (Array.isArray(snapshot.teacherMaterials)) {
    db.teacherMaterials = cloneData(snapshot.teacherMaterials);
  }
  if (Array.isArray(snapshot.sentNotifications)) {
    db.sentNotifications = cloneData(snapshot.sentNotifications);
  }
  if (Array.isArray(snapshot.grades)) {
    db.grades = cloneData(snapshot.grades);
  }
  if (Array.isArray(snapshot.revenues)) {
    db.revenues = cloneData(snapshot.revenues);
  }
  if (typeof snapshot.comboDiscountRate === 'number') {
    db.comboDiscountRate = snapshot.comboDiscountRate;
  }
  if (Array.isArray(snapshot.auditLogs)) {
    db.auditLogs = cloneData(snapshot.auditLogs);
  }
}

function saveAppSnapshot(force) {
  if (!state.autosaveEnabled && !force) {
    return;
  }
  const payload = {
    version: APP_SNAPSHOT_VERSION,
    savedAt: new Date().toISOString(),
    state: getPersistedStateSnapshot(),
    db: getPersistedDbSnapshot()
  };
  safeStorageSet(APP_SNAPSHOT_KEY, JSON.stringify(payload));
}

function scheduleAppSnapshotSave() {
  if (!state.autosaveEnabled) {
    return;
  }
  if (appSnapshotTimer) {
    clearTimeout(appSnapshotTimer);
  }
  appSnapshotTimer = setTimeout(function () {
    saveAppSnapshot(false);
  }, 240);
}

function startAppAutosaveHeartbeat() {
  if (appAutosaveHeartbeat) {
    return;
  }
  appAutosaveHeartbeat = setInterval(function () {
    saveAppSnapshot(false);
  }, 12000);
  window.addEventListener('beforeunload', function () {
    saveAppSnapshot(true);
  });
}

function loadAppSnapshot() {
  const raw = safeStorageGet(APP_SNAPSHOT_KEY);
  if (!raw) {
    return false;
  }
  try {
    const payload = JSON.parse(raw);
    if (!payload || payload.version !== APP_SNAPSHOT_VERSION) {
      return false;
    }
    applyPersistedDbSnapshot(payload.db);
    applyPersistedStateSnapshot(payload.state);
    return true;
  } catch (e) {
    return false;
  }
}

function clearAppSnapshot() {
  const keys = [];
  let i;
  for (i = 0; i < APP_DRAFT_FIELDS.length; i++) {
    keys.push(APP_DRAFT_PREFIX + APP_DRAFT_FIELDS[i]);
  }
  keys.push(APP_SNAPSHOT_KEY);
  for (i = 0; i < keys.length; i++) {
    safeStorageRemove(keys[i]);
  }
}

function applyReducedMotionPreference(enabled, silent) {
  state.reducedMotion = !!enabled;
  if (state.reducedMotion) {
    document.documentElement.setAttribute('data-reduced-motion', '1');
  } else {
    document.documentElement.removeAttribute('data-reduced-motion');
  }
  if (!silent) {
    toast(state.reducedMotion ? 'Đã bật chế độ giảm chuyển động.' : 'Đã tắt chế độ giảm chuyển động.');
  }
  scheduleAppSnapshotSave();
}

function toggleReducedMotionPreference() {
  applyReducedMotionPreference(!state.reducedMotion, false);
}

function ensureScreenLoadingBar() {
  let bar = byId('screenLoadingBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'screenLoadingBar';
    bar.className = 'screen-loading-bar';
    document.body.appendChild(bar);
  }
  return bar;
}

function startScreenLoading() {
  const bar = ensureScreenLoadingBar();
  bar.classList.add('show');
}

function finishScreenLoading() {
  const bar = ensureScreenLoadingBar();
  if (screenLoadingHideTimer) {
    clearTimeout(screenLoadingHideTimer);
  }
  screenLoadingHideTimer = setTimeout(function () {
    bar.classList.remove('show');
  }, 140);
}

function ensureScrollTopButton() {
  let btn = byId('scrollToTopBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'scrollToTopBtn';
    btn.className = 'scroll-top-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Lên đầu trang');
    btn.textContent = '↑';
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: state.reducedMotion ? 'auto' : 'smooth' });
    });
    document.body.appendChild(btn);
  }
  return btn;
}

function updateScrollTopButtonVisibility() {
  const btn = ensureScrollTopButton();
  if (window.scrollY > 280) {
    btn.classList.add('show');
  } else {
    btn.classList.remove('show');
  }
}

function initScrollTopButton() {
  ensureScrollTopButton();
  updateScrollTopButtonVisibility();
  if (!window.__studyhomeScrollTopBound) {
    window.addEventListener('scroll', updateScrollTopButtonVisibility, { passive: true });
    window.__studyhomeScrollTopBound = true;
  }
}


function renderProgressBar(percent) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  return '<div class="progress-bar"><div class="progress-green progress-green-dynamic" data-width="' + safePercent + '"></div></div>';
}

function hydrateProgressBars(container) {
  if (!container) {
    return;
  }
  const bars = container.querySelectorAll('.progress-green-dynamic');
  let i;
  for (i = 0; i < bars.length; i++) {
    const value = Number(bars[i].getAttribute('data-width'));
    const safePercent = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
    bars[i].style.width = safePercent + '%';
  }
}


function getAccountById(id) {
  let i;
  for (i = 0; i < db.accounts.length; i++) {
    if (db.accounts[i].id === id) {
      return db.accounts[i];
    }
  }
  return null;
}

function getClassByCode(code) {
  let i;
  for (i = 0; i < db.classes.length; i++) {
    if (db.classes[i].code === code) {
      return db.classes[i];
    }
  }
  return null;
}

function getStudentSubjectCodes(student) {
  if (student && student.subjectCodes && student.subjectCodes.length) {
    return student.subjectCodes;
  }
  if (student && student.classCode) {
    return [student.classCode];
  }
  return ['L01'];
}

function getSubjectDisplay(code) {
  const c = getClassByCode(code);
  if (!c) {
    return code;
  }
  return c.subject + ' - ' + c.level;
}

function getSubjectIconSvg(subject) {
  if (subject === 'Toán') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16"/><path d="M4 17h16"/><path d="M9 12h6"/></svg>';
  }
  if (subject === 'Vật lí') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>';
  }
  if (subject === 'Hóa học') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 2v5l-5 8a4 4 0 0 0 3.4 6h7.2a4 4 0 0 0 3.4-6l-5-8V2"/><path d="M8 14h8"/></svg>';
  }
  if (subject === 'Ngữ văn') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21V4.5A2.5 2.5 0 0 1 6.5 2z"/></svg>';
  }
  if (subject === 'Tiếng Anh') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18"/><path d="M12 3a15 15 0 0 0 0 18"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5L12 21l9-4.5"/></svg>';
}

function getRoleLabel(role) {
  if (role === 'staff') {
    return 'Nhân viên';
  }
  if (role === 'teacher') {
    return 'Giáo viên';
  }
  if (role === 'student') {
    return 'Học viên';
  }
  return role || '-';
}

function getPrimarySubjectClasses() {
  const picked = [];
  const seen = {};
  let i;
  for (i = 0; i < db.classes.length; i++) {
    const c = db.classes[i];
    if (!seen[c.subject]) {
      picked.push(c);
      seen[c.subject] = true;
    }
  }
  return picked;
}

function getCurrentStudent() {
  const user = getAccountById(state.currentUserId);
  if (user && user.role === 'student') {
    return user;
  }
  return getAccountById('HV001');
}

function getCurrentTeacher() {
  const user = getAccountById(state.currentUserId);
  if (user && user.role === 'teacher') {
    return user;
  }
  let i;
  for (i = 0; i < db.accounts.length; i++) {
    if (db.accounts[i].role === 'teacher') {
      return db.accounts[i];
    }
  }
  return null;
}

function renderSubjectContextLabels() {
  const c = getClassByCode(state.selectedClassCode) || db.classes[0];
  if (!c) {
    return;
  }
  if (byId('teacherSelectedSubjectLabel')) {
    byId('teacherSelectedSubjectLabel').textContent = ' - ' + c.subject;
  }
  if (byId('studentSelectedSubjectLabel')) {
    byId('studentSelectedSubjectLabel').textContent = ' - ' + c.subject;
  }
  const ids = ['studentCrumbSubjectMaterials', 'studentCrumbSubjectHomeworkList', 'studentCrumbSubjectHomeworkDetail', 'studentCrumbSubjectGrades'];
  let i;
  for (i = 0; i < ids.length; i++) {
    if (byId(ids[i])) {
      byId(ids[i]).textContent = c.subject;
    }
  }

  const teacherHomeworkBread = document.querySelector('#s-teacher-homework .breadcrumb .bc-link');
  if (teacherHomeworkBread) {
    teacherHomeworkBread.textContent = c.subject + ' - Tạo bài tập';
  }
  const teacherAttendanceBread = document.querySelector('#s-teacher-attendance .breadcrumb .bc-link');
  if (teacherAttendanceBread) {
    teacherAttendanceBread.textContent = 'Điểm danh - ' + c.subject;
  }
  const teacherGradesBread = document.querySelector('#s-teacher-grades .breadcrumb .bc-link');
  if (teacherGradesBread) {
    teacherGradesBread.textContent = 'Bảng điểm - ' + c.subject;
  }
}

