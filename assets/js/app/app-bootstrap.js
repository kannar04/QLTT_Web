function syncScreen(id) {
  applyDynamicHeaders();
  applyDynamicNavbars();
  applyDynamicSidebars();
  applyDynamicBreadcrumbs();
  renderActiveHeaderUser();
  if (id === 's-teacher-dashboard') {
    renderTeacherSubjectDashboard();
    renderSubjectContextLabels();
  }
  if (id === 's-student-dashboard') {
    renderStudentSubjectDashboard();
    renderStudentDashboardWidgets();
    renderSubjectContextLabels();
  }
  if (id === 's-teacher-class-detail' || id === 's-student-class-detail' || id === 's-teacher-homework' || id === 's-teacher-attendance' || id === 's-teacher-grades' || id === 's-student-materials' || id === 's-student-homework-list' || id === 's-student-homework-detail') {
    renderSubjectContextLabels();
  }
  if (id === 's-account-list') {
    renderAccountTable();
  }
  if (id === 's-student-profile-search') {
    renderStudentProfileTable();
  }
  if (id === 's-student-profile-detail') {
    renderStudentDetail(state.selectedAccountId);
  }
  if (id === 's-class-manage') {
    renderClassGrid();
  }
  if (id === 's-class-detail') {
    renderClassDetail();
  }
  if (id === 's-student-materials') {
    renderStudentMaterialList();
  }
  if (id === 's-student-class-detail') {
    renderStudentClassDetailContent();
    renderStudentCourseTranscriptWidget();
  }
  if (id === 's-student-transcript') {
    renderStudentGrades();
  }
  if (id === 's-student-homework-list') {
    renderStudentHomeworkList();
  }
  if (id === 's-student-homework-detail') {
    renderHomeworkDetail();
  }
  if (id === 's-teacher-attendance') {
    renderTeacherAttendance();
  }
  if (id === 's-teacher-grades') {
    renderTeacherGrades();
  }
  if (id === 's-student-absence-history') {
    renderAbsenceHistory();
  }
  if (id === 's-student-absence-create') {
    fillAbsenceClassOptions();
  }
  if (id === 's-student-timetable') {
    renderStudentTimetable();
    renderStudentHomeworkDueSoon();
  }
  if (id === 's-student-exam-schedule') {
    renderStudentExamSchedule();
  }
  if (id === 's-student-tuition-detail') {
    renderTuition();
  }
  if (id === 's-student-payment-process') {
    renderStudentPaymentProcess();
  }
  if (id === 's-student-payment-confirm') {
    renderPaymentConfirm();
  }
  if (id === 's-student-payment-history') {
    renderPaymentHistory();
  }
  if (id === 's-student-notifications') {
    renderNotifications();
  }
  if (id === 's-teacher-notifications') {
    renderTeacherNotifications();
  }
  if (id === 's-staff-home') {
    renderStaffSidebarStats();
  }
  if (id === 's-staff-leave-approval') {
    renderStaffLeaveApproval();
  }
  if (id === 's-staff-invoice-manage') {
    renderInvoiceClassOptions();
    renderInvoiceClassPreview();
    renderStaffInvoiceList();
  }
  if (id === 's-timetable') {
    initScheduleForm();
  }
  if (id === 's-staff-notification-send') {
    renderInvoiceClassOptions();
    renderStaffNotificationHistory();
  }
  if (id === 's-student-profile') {
    renderStudentProfile();
  }
  const activeScreen = byId(id);
  if (activeScreen) {
    if (typeof normalizeInlineHandlersToDelegation === 'function') {
      normalizeInlineHandlersToDelegation(activeScreen);
    }
    applyAccessibilityPolish(activeScreen);
  }
}

function bindEvents() {
  function on(id, eventName, handler) {
    const el = byId(id);
    if (el) {
      el.addEventListener(eventName, handler);
    }
  }

  on('btn-login-staff', 'click', function () {
    loginByRole('staff', 's-staff-home');
  });
  on('btn-login-teacher', 'click', function () {
    loginByRole('teacher', 's-teacher-dashboard');
  });
  on('btn-login-student', 'click', function () {
    loginByRole('student', 's-student-dashboard');
  });

  const debouncedAccountRender = typeof createDebounced === 'function'
    ? createDebounced(function () {
      state.accountTablePage = 1;
      renderAccountTable();
    }, 180)
    : function () {
      state.accountTablePage = 1;
      renderAccountTable();
    };
  const debouncedStudentRender = typeof createDebounced === 'function'
    ? createDebounced(function () {
      state.studentProfileTablePage = 1;
      renderStudentProfileTable();
    }, 180)
    : function () {
      state.studentProfileTablePage = 1;
      renderStudentProfileTable();
    };
  on('accountSearchInput', 'input', debouncedAccountRender);
  on('studentProfileSearchInput', 'input', debouncedStudentRender);
  on('btnCreateAccount', 'click', createAccount);
  on('btnUpdateAccount', 'click', updateAccount);

  on('btnCreateClass', 'click', createClass);
  on('btnCreateClassInline', 'click', createClass);
  on('btnDeleteClass', 'click', deleteSelectedClass);
  on('btnAddStudentToClass', 'click', addStudentToClass);
  on('btnRemoveStudentFromClass', 'click', removeStudentByInput);
  on('btnSaveClassDetail', 'click', saveClassDetail);

  on('btnSubmitHomework', 'click', submitHomework);
  on('btnSubmitAbsence', 'click', submitAbsenceRequest);
  on('btnConfirmPayment', 'click', confirmPayment);
  on('btnTeacherAttendanceUpload', 'click', handleTeacherAttendanceUpload);
  on('btnTeacherDocUpload', 'click', saveTeacherDocument);
  on('btnTeacherHomeworkSave', 'click', saveTeacherHomework);
  on('btnOpenScheduleForm', 'click', function () {
    const panel = byId('staffScheduleForm');
    if (panel) {
      panel.classList.toggle('inline-hidden');
    }
  });
  on('btnOpenBulkImport', 'click', function () {
    const panel = byId('bulkImportPanel');
    if (panel) {
      panel.classList.toggle('inline-hidden');
      const old = byId('bulkImportPreviewWrap');
      if (old) {
        old.remove();
      }
    }
  });
  on('btnTeacherWeightConfig', 'click', openTeacherWeightModal);
  on('btnTeacherAddGradeColumn', 'click', addTeacherGradeColumn);
  on('btnTeacherGradeLock', 'click', lockTeacherGradeBook);
  on('btnTeacherGradeUpload', 'click', saveTeacherGrades);
}

function initLoginUxEnhancements() {
  const loginConfig = [
    { role: 'staff', target: 's-staff-home' },
    { role: 'teacher', target: 's-teacher-dashboard' },
    { role: 'student', target: 's-student-dashboard' }
  ];
  let i;
  for (i = 0; i < loginConfig.length; i++) {
    const cfg = loginConfig[i];
    const root = byId('s-login-' + cfg.role);
    if (!root) {
      continue;
    }
    const accountInput = root.querySelector('input[type="text"]');
    const passInput = root.querySelector('.login-password-wrap input') || root.querySelector('input[type="password"]');

    if (accountInput) {
      accountInput.addEventListener('input', function (event) {
        const input = event.target;
        input.value = input.value.toUpperCase();
        clearInputError(input);
      });
    }

    if (passInput) {
      passInput.addEventListener('input', function (event) {
        clearInputError(event.target);
      });
    }

    function submitOnEnter(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        loginByRole(cfg.role, cfg.target);
      }
    }

    if (accountInput) {
      accountInput.addEventListener('keydown', submitOnEnter);
    }
    if (passInput) {
      passInput.addEventListener('keydown', submitOnEnter);
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  if (typeof initRuntimeUpgradeServices === 'function') {
    initRuntimeUpgradeServices();
  }
  initRuntimeEnhancements();
  state.currentUserId = '';
  state.restoreTargetScreen = '';
  state.screenHistory = [];
  initSkipLink();
  initModalAccessibility();
  initScreens();
  injectStaffLayouts();
  bindEvents();
  initLoginUxEnhancements();
  if (typeof bindLandingLoginShortcuts === 'function') {
    bindLandingLoginShortcuts();
  }
  if (typeof bindLoginCapsLockHints === 'function') {
    bindLoginCapsLockHints();
  }
  if (typeof renderLandingRoleHint === 'function') {
    renderLandingRoleHint();
  }
  applyDynamicHeaders();
  applyDynamicNavbars();
  applyDynamicSidebars();
  applyDynamicBreadcrumbs();
  renderSideCalendars();
  renderTeacherSubjectDashboard();
  renderStudentSubjectDashboard();
  renderStudentDashboardWidgets();
  renderSubjectContextLabels();
  renderAccountTable();
  renderStudentProfileTable();
  renderClassGrid();
  renderClassDetail();
  renderStudentMaterialList();
  renderStudentHomeworkList();
  renderStudentClassDetailContent();
  renderHomeworkDetail();
  renderTeacherAttendance();
  renderAbsenceHistory();
  renderTuition();
  renderPaymentConfirm();
  renderPaymentHistory();
  renderNotifications();
  renderTeacherNotifications();
  renderStudentGrades();
  renderStudentTimetable();
  renderStudentExamSchedule();
  renderInvoiceClassOptions();
  renderInvoiceClassPreview();
  renderStaffLeaveApproval();
  renderStaffInvoiceList();
  renderStaffNotificationHistory();
  fillAbsenceClassOptions();
  renderStudentProfile();
  initScheduleForm();
  applyDynamicHeaders();
  applyDynamicNavbars();
  applyDynamicSidebars();
  applyDynamicBreadcrumbs();
  if (typeof normalizeInlineHandlersToDelegation === 'function') {
    normalizeInlineHandlersToDelegation(document);
  }
  applyAccessibilityPolish(document);
  renderStaffSidebarStats();
  renderActiveHeaderUser();

  state.lastScreenId = 's-landing';
  show('s-landing', true);

  scheduleAppSnapshotSave();
});
