const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const appUrl = pathToFileURL(path.join(__dirname, '..', '..', 'studyhome_upgraded.html')).href;

const LOGIN_BY_ROLE = {
  staff: {
    accountInput: '#loginStaffAccount',
    passwordInput: '#loginStaffPassword',
    button: '#btn-login-staff',
    user: 'NV001',
    target: '#s-staff-home'
  },
  teacher: {
    accountInput: '#loginTeacherAccount',
    passwordInput: '#loginTeacherPassword',
    button: '#btn-login-teacher',
    user: 'GV001',
    target: '#s-teacher-dashboard'
  },
  student: {
    accountInput: '#loginStudentAccount',
    passwordInput: '#loginStudentPassword',
    button: '#btn-login-student',
    user: 'HV001',
    target: '#s-student-dashboard'
  }
};

async function loginAs(page, role) {
  const cfg = LOGIN_BY_ROLE[role];
  await page.goto(appUrl);
  await page.evaluate((screenId) => {
    show(screenId, true);
  }, 's-login-' + role);
  await page.fill(cfg.accountInput, cfg.user);
  await page.fill(cfg.passwordInput, '111111');
  await page.click(cfg.button);
  await expect(page.locator(cfg.target + '.active')).toBeVisible();
}

test('login theo role', async ({ page }) => {
  const roles = ['staff', 'teacher', 'student'];
  for (const role of roles) {
    await loginAs(page, role);
  }
});

test('luong hoc phi hoc vien', async ({ page }) => {
  await loginAs(page, 'student');
  const unpaidBefore = await page.evaluate(() => {
    const student = getCurrentStudent();
    return db.invoices.filter((x) => x.studentId === student.id && x.status === 'unpaid').length;
  });
  expect(unpaidBefore).toBeGreaterThan(0);

  await page.evaluate(() => {
    const student = getCurrentStudent();
    const inv = db.invoices.find((x) => x.studentId === student.id && x.status === 'unpaid');
    state.selectedTuitionInvoiceId = inv.id;
    state.selectedPaymentMethod = 'cash';
    confirmPayment();
  });

  const unpaidAfter = await page.evaluate(() => {
    const student = getCurrentStudent();
    return db.invoices.filter((x) => x.studentId === student.id && x.status === 'unpaid').length;
  });
  expect(unpaidAfter).toBe(unpaidBefore - 1);
  await expect(page.locator('#s-student-tuition.active')).toBeVisible();
});

test('luong nop bai tap hoc vien', async ({ page }) => {
  await loginAs(page, 'student');
  const hasHomework = await page.evaluate(() => {
    const student = getCurrentStudent();
    const classCode = getStudentSubjectCodes(student)[0];
    state.selectedClassCode = classCode;
    const list = db.homeworks[classCode] || [];
    if (!list.length) {
      return false;
    }
    state.selectedHomeworkId = list[0].id;
    show('s-student-homework-detail');
    renderHomeworkDetail();
    return true;
  });
  expect(hasHomework).toBeTruthy();

  const before = await page.evaluate(() => db.submissions.length);
  await page.click('#btnSubmitHomework');
  await page.setInputFiles('#studentHomeworkFileInput', {
    name: 'homework.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('nop bai tap')
  });
  await page.click('#btnSubmitHomework');
  const after = await page.evaluate(() => db.submissions.length);
  expect(after).toBe(before + 1);
});

test('luong diem danh giao vien', async ({ page }) => {
  await loginAs(page, 'teacher');
  await page.evaluate(() => {
    show('s-teacher-attendance');
  });

  const firstStudentId = await page.evaluate(() => {
    const row = document.querySelector('#teacherAttendanceBody tr');
    return row ? row.getAttribute('data-student-id') : '';
  });
  expect(firstStudentId).not.toBe('');

  const before = await page.evaluate((studentId) => {
    return db.notifications.filter((n) => (n.to || n.audience) === studentId).length;
  }, firstStudentId);

  await page.check('#teacherAttendanceBody tr:first-child .att-absent');
  await page.click('#btnTeacherAttendanceUpload');

  const after = await page.evaluate((studentId) => {
    return db.notifications.filter((n) => (n.to || n.audience) === studentId).length;
  }, firstStudentId);

  expect(after).toBeGreaterThan(before);
});

test('luong bang diem va khoa so + undo', async ({ page }) => {
  await loginAs(page, 'teacher');
  await page.evaluate(() => {
    show('s-teacher-grades');
  });

  const firstStudentId = await page.evaluate(() => {
    const row = document.querySelector('#teacherGradesBody tr');
    return row ? row.getAttribute('data-student-id') : '';
  });
  expect(firstStudentId).not.toBe('');

  const firstRowGradeInputs = page.locator('#teacherGradesBody tr').first().locator('input.grade-cell');
  await expect(firstRowGradeInputs).toHaveCount(3);
  await firstRowGradeInputs.nth(0).fill('9');
  await firstRowGradeInputs.nth(1).fill('8.5');
  await firstRowGradeInputs.nth(2).fill('8');
  await page.click('#btnTeacherGradeUpload');

  const hasSavedGrade = await page.evaluate((studentId) => {
    const g = db.grades.find((x) => x.studentId === studentId);
    return !!g && Number(g.score1) >= 9;
  }, firstStudentId);
  expect(hasSavedGrade).toBeTruthy();

  page.once('dialog', (dialog) => dialog.accept());
  await page.click('#btnTeacherGradeLock');
  const locked = await page.evaluate(() => !!state.teacherGradeLocked);
  expect(locked).toBeTruthy();

  await page.evaluate(() => {
    undoLastAction(true);
  });
  const unlocked = await page.evaluate(() => !!state.teacherGradeLocked);
  expect(unlocked).toBeFalsy();
});
