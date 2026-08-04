// B2, B3, B6 LAYERS: UI Rendering & UI State Management
// Đảm nhận việc vẽ Task Card ra DOM, bật tắt Loading/Empty/Error state, và quản lý các Modals.

// Trạng thái DOM
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const taskGrid = document.getElementById('taskGrid');

// B2: Helper function để dịch enum
const translateStatus = (status) => {
  if (status === 'todo') return 'Chưa thực hiện';
  if (status === 'doing') return 'Đang thực hiện';
  if (status === 'done') return 'Đã hoàn thành';
  return status;
};

const translatePriority = (priority) => {
  if (priority === 'high') return 'Cao';
  if (priority === 'medium') return 'Trung bình';
  if (priority === 'low') return 'Thấp';
  return priority;
};

// B2: UI States
window.uiShowLoading = () => {
  loadingState.classList.remove('hidden');
  emptyState.classList.add('hidden');
  errorState.classList.add('hidden');
  taskGrid.classList.add('hidden');
};

window.uiShowEmpty = () => {
  loadingState.classList.add('hidden');
  emptyState.classList.remove('hidden');
  errorState.classList.add('hidden');
  taskGrid.classList.add('hidden');
};

window.uiShowError = (msg = '') => {
  if (msg) errorState.querySelector('p').innerText = msg;
  loadingState.classList.add('hidden');
  emptyState.classList.add('hidden');
  errorState.classList.remove('hidden');
  taskGrid.classList.add('hidden');
};

// B3 & B6: Render Array
window.uiRenderTasks = (tasksToRender, role = 'student') => {
  if (!tasksToRender || tasksToRender.length === 0) {
    window.uiShowEmpty();
    return;
  }

  loadingState.classList.add('hidden');
  emptyState.classList.add('hidden');
  errorState.classList.add('hidden');
  taskGrid.classList.remove('hidden');
  
  // Array.map() với Arrow Function (B3)
  const htmlContent = tasksToRender.map((task) => {
    // B6: Tùy chỉnh action buttons theo role
    let actionButtons = '';
    if (role === 'teacher') {
      actionButtons = `
        <div class="card-actions">
          <button type="button" class="btn btn-outline btn-small edit-task-btn" data-task-id="${task.id}" aria-label="Sửa nhiệm vụ ${task.id}">Sửa</button>
          <button type="button" class="btn btn-danger btn-small delete-task-btn" data-task-id="${task.id}" aria-label="Xóa nhiệm vụ ${task.id}">Xóa</button>
        </div>
      `;
    }

    return `
      <button type="button" class="task-card" data-task-id="${task.id}" aria-label="Xem chi tiết nhiệm vụ ${task.id}">
        <div class="card-header">
          <span class="task-id">#${task.id}</span>
          <span class="task-status status-${task.status}">${translateStatus(task.status)}</span>
        </div>
        <div class="task-title">${task.title}</div>
        <div class="task-desc">${task.description}</div>
        <div class="card-footer">
          <div class="task-meta">
            Chủ đề: <strong>${task.topic}</strong>
          </div>
        </div>
        <div class="card-footer" style="border-top: none; padding-top: 4px;">
          <div class="task-meta">
            Hạn chót: <strong>${task.deadline}</strong>
          </div>
          <div class="task-meta">
            Ưu tiên: <strong class="priority-${task.priority}">${translatePriority(task.priority)}</strong>
          </div>
        </div>
        ${actionButtons}
      </button>
    `;
  }).join("");
  
  taskGrid.innerHTML = htmlContent;
};

// B3: Modal Detail (Read-Only)
const taskModal = document.getElementById('taskModal');
const modalBody = document.getElementById('modalBody');
const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
const closeDetailFooterBtn = document.getElementById('closeDetailFooterBtn');

window.uiOpenTaskDetail = (task) => {
  modalBody.innerHTML = `
    <p><strong>ID:</strong> #${task.id}</p>
    <p><strong>Tiêu đề:</strong> ${task.title}</p>
    <p><strong>Chủ đề:</strong> ${task.topic}</p>
    <p><strong>Hạn chót:</strong> ${task.deadline}</p>
    <p><strong>Trạng thái:</strong> <span class="task-status status-${task.status}">${translateStatus(task.status)}</span></p>
    <p><strong>Ưu tiên:</strong> <span class="priority-${task.priority}">${translatePriority(task.priority)}</span></p>
    <p><strong>Mô tả chi tiết:</strong> ${task.description}</p>
  `;
  taskModal.classList.remove('hidden');
  closeDetailModalBtn.focus();
};

window.uiCloseTaskDetail = () => {
  taskModal.classList.add('hidden');
};

[closeDetailModalBtn, closeDetailFooterBtn].forEach(btn => {
  if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); window.uiCloseTaskDetail(); });
});

taskModal.addEventListener('click', (e) => {
  if (e.target === taskModal) window.uiCloseTaskDetail();
});

// B6: Shared Create/Edit Form Modal
const taskFormModal = document.getElementById('taskFormModal');
const formModalTitle = document.getElementById('formModalTitle');
const taskForm = document.getElementById('taskForm');
const closeFormModalBtn = document.getElementById('closeFormModalBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');

window.uiOpenTaskForm = (task = null) => {
  if (task) {
    formModalTitle.innerText = "Sửa nhiệm vụ";
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskTopic').value = task.topic;
    document.getElementById('taskDeadline').value = task.deadline;
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskDesc').value = task.description;
  } else {
    formModalTitle.innerText = "Thêm nhiệm vụ mới";
    taskForm.reset();
  }
  taskFormModal.classList.remove('hidden');
  closeFormModalBtn.focus();
};

window.uiCloseTaskForm = () => {
  taskFormModal.classList.add('hidden');
};

[closeFormModalBtn, cancelFormBtn].forEach(btn => {
  if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); window.uiCloseTaskForm(); });
});

taskFormModal.addEventListener('click', (e) => {
  if (e.target === taskFormModal) window.uiCloseTaskForm();
});

// B6: Delete Confirmation Modal
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

window.uiOpenDeleteConfirm = () => {
  deleteConfirmModal.classList.remove('hidden');
  closeDeleteModalBtn.focus();
};

window.uiCloseDeleteConfirm = () => {
  deleteConfirmModal.classList.add('hidden');
};

[closeDeleteModalBtn, cancelDeleteBtn].forEach(btn => {
  if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); window.uiCloseDeleteConfirm(); });
});

deleteConfirmModal.addEventListener('click', (e) => {
  if (e.target === deleteConfirmModal) window.uiCloseDeleteConfirm();
});

// Escape key to close any modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!taskModal.classList.contains('hidden')) window.uiCloseTaskDetail();
    if (!taskFormModal.classList.contains('hidden')) window.uiCloseTaskForm();
    if (!deleteConfirmModal.classList.contains('hidden')) window.uiCloseDeleteConfirm();
  }
});
