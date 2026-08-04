// CORE LAYER: Orchestration
// Kết nối các module và điều khiển View/State toàn cục

let currentTasks = [];
let currentRole = null; // 'student' | 'teacher' | null (public)
let selectedTaskId = null; // Dùng cho Edit/Delete

// DOM Selectors cho View
const publicView = document.getElementById('public-view');
const authView = document.getElementById('authenticated-view');
const studentView = document.getElementById('student-view');
const teacherView = document.getElementById('teacher-view');
const headerPublicActions = document.getElementById('header-public-actions');
const headerAuthActions = document.getElementById('header-auth-actions');
const userEmailDisplay = document.getElementById('userEmailDisplay');

// DOM Selectors cho Shared Board
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const statusFilter = document.getElementById('statusFilter');
const resetBtn = document.getElementById('resetBtn');
const taskGrid = document.getElementById('taskGrid');

// B6: DOM form buttons
const btnOpenCreateForm = document.getElementById('btnOpenCreateForm');
const taskForm = document.getElementById('taskForm');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const btnLogout = document.getElementById('btnLogout');

// --- HÀM TẢI DỮ LIỆU CHUNG ---
const loadTasks = async () => {
  window.uiShowLoading();
  try {
    if (!currentRole) {
      // Public Flow -> Local JSON
      currentTasks = await window.fetchLocalTasks();
    } else {
      // Authenticated Flow -> Firestore
      currentTasks = await window.fetchFirestoreTasks();
    }
    applyFilters();
  } catch (error) {
    window.uiShowError();
  }
};

// --- HÀM ÁP DỤNG FILTER ---
const applyFilters = () => {
  const keyword = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const filteredTasks = window.filterTasks(currentTasks, keyword, status);
  
  if (filteredTasks.length === 0 && currentTasks.length > 0) {
    window.uiShowEmpty();
  } else {
    // Render theo role hiện tại
    window.uiRenderTasks(filteredTasks, currentRole || 'public');
  }
};

// --- CHUYỂN ĐỔI VIEW (STATE MACHINE) ---
const switchView = (role, user) => {
  currentRole = role;
  
  // Reset trạng thái search/filter
  searchInput.value = '';
  statusFilter.value = 'all';

  if (!role) {
    // Public View
    publicView.classList.remove('hidden');
    authView.classList.add('hidden');
    headerPublicActions.classList.remove('hidden');
    headerAuthActions.classList.add('hidden');
  } else {
    // Authenticated View
    publicView.classList.add('hidden');
    authView.classList.remove('hidden');
    headerPublicActions.classList.add('hidden');
    headerAuthActions.classList.remove('hidden');
    userEmailDisplay.innerText = user.email;

    if (role === 'teacher') {
      teacherView.classList.remove('hidden');
      studentView.classList.add('hidden');
    } else {
      studentView.classList.remove('hidden');
      teacherView.classList.add('hidden');
    }
  }
  
  // Tải dữ liệu theo role mới
  loadTasks();
};

// --- AUTH STATE OBSERVER ---
// Được kích hoạt từ auth.js
window.onAuthChangedCallback = async (user) => {
  if (user) {
    // Kiểm tra và tạo profile nếu cần (B6)
    const role = await window.ensureUserProfileAndGetRole(user.uid);
    switchView(role, user);
  } else {
    switchView(null, null);
  }
};

// --- GẮN SỰ KIỆN (EVENT LISTENERS) ---

// 1. Search & Filter
searchBtn.addEventListener('click', applyFilters);
statusFilter.addEventListener('change', applyFilters);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyFilters();
});
resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  statusFilter.value = 'all';
  applyFilters();
});

// 2. Auth Logout
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    window.logoutUser();
  });
}

// 3. Grid Click (Event Delegation)
taskGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.task-card');
  const editBtn = e.target.closest('.edit-task-btn');
  const deleteBtn = e.target.closest('.delete-task-btn');

  if (deleteBtn) {
    e.stopPropagation();
    selectedTaskId = deleteBtn.getAttribute('data-task-id');
    window.uiOpenDeleteConfirm();
  } else if (editBtn) {
    e.stopPropagation();
    selectedTaskId = editBtn.getAttribute('data-task-id');
    const task = window.findTaskById(currentTasks, selectedTaskId);
    if (task) window.uiOpenTaskForm(task);
  } else if (card) {
    const taskId = card.getAttribute('data-task-id');
    const task = window.findTaskById(currentTasks, taskId);
    if (task) window.uiOpenTaskDetail(task);
  }
});

// 4. Create/Edit Form Submit (B6)
if (btnOpenCreateForm) {
  btnOpenCreateForm.addEventListener('click', () => {
    selectedTaskId = null; // Create mode
    window.uiOpenTaskForm(null);
  });
}

if (saveTaskBtn) {
  saveTaskBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!taskForm.checkValidity()) {
      taskForm.reportValidity();
      return;
    }

    const taskData = {
      title: document.getElementById('taskTitle').value,
      topic: document.getElementById('taskTopic').value,
      deadline: document.getElementById('taskDeadline').value,
      status: document.getElementById('taskStatus').value,
      priority: document.getElementById('taskPriority').value,
      description: document.getElementById('taskDesc').value
    };

    saveTaskBtn.disabled = true;
    saveTaskBtn.innerText = "Đang lưu...";

    try {
      if (selectedTaskId) {
        await window.updateFirestoreTask(selectedTaskId, taskData);
      } else {
        await window.createFirestoreTask(taskData);
      }
      window.uiCloseTaskForm();
      loadTasks(); // Tải lại sau khi Write
    } catch (error) {
      alert("Có lỗi xảy ra. Xem console để biết thêm chi tiết.");
    } finally {
      saveTaskBtn.disabled = false;
      saveTaskBtn.innerText = "Lưu";
    }
  });
}

// 5. Delete Confirm Submit (B6)
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!selectedTaskId) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerText = "Đang xóa...";

    try {
      await window.deleteFirestoreTask(selectedTaskId);
      window.uiCloseDeleteConfirm();
      loadTasks(); // Tải lại sau khi Delete
    } catch (error) {
      alert("Có lỗi xảy ra. Xem console để biết thêm chi tiết.");
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.innerText = "Xóa";
      selectedTaskId = null;
    }
  });
}

// Khởi tạo ban đầu (Nếu chưa có Firebase hoặc Auth chưa resolve, ta có thể hiển thị Public View trước)
// Tuy nhiên onAuthStateChanged sẽ tự động gọi khi Firebase khởi tạo xong.
// Nếu config bị thiếu, onAuthStateChanged sẽ không kích hoạt, ta phải gọi thủ công.
window.addEventListener('load', () => {
  if (window.firebaseConfigMissing || typeof firebase === 'undefined') {
    switchView(null, null);
  }
});
