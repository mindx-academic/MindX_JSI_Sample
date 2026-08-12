/* JSI 2026 Optional Extensions V1 - Task UI Module (Derived) */

(function(window) {
  'use strict';

  var TaskUI = {
    showOperationFeedback: function(type, message) {
      var existing = document.getElementById('task-operation-feedback');
      if (existing) existing.remove();

      var feedback = document.createElement('div');
      feedback.id = 'task-operation-feedback';
      feedback.className = 'alert alert-' + (type === 'success' ? 'success' : 'danger') + ' shadow task-operation-feedback';
      feedback.setAttribute('role', type === 'success' ? 'status' : 'alert');
      feedback.textContent = message;
      document.body.appendChild(feedback);

      window.setTimeout(function() {
        if (feedback.parentNode) feedback.remove();
      }, 5000);
    },

    /**
     * Shows Task Detail Modal with 5-Tab Container
     */
    showTaskDetail: function(taskId, initialTab) {
      var tasks = window.AppBridge ? window.AppBridge.getTasks() : (window.currentTasks || []);
      var task = tasks.find(function(t) { return (t.id === taskId || t.taskId === taskId); });

      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }

      window.selectedTaskId = taskId;

      var modalEl = document.getElementById('task-detail-modal');
      if (!modalEl) {
        modalEl = createDetailModal();
        document.body.appendChild(modalEl);
      }

      var modalTitle = modalEl.querySelector('#detail-modal-title');
      if (modalTitle) modalTitle.textContent = '#' + (task.id || 'T') + ' - ' + task.title;

      var bodyContainer = modalEl.querySelector('#detail-modal-body');
      if (bodyContainer && window.TaskDetailController) {
        window.TaskDetailController.mountContainer(task, bodyContainer, initialTab || 'resources');
      }

      var bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
      bsModal.show();
    },

    /**
     * Shows Teacher Create Task Modal with embedded Resource Manager
     */
    showCreateModal: function() {
      this.showTaskFormModal(null);
    },

    /**
     * Shows Teacher Edit Task Modal with embedded Resource Manager
     */
    showEditModal: function(taskId) {
      var tasks = window.AppBridge ? window.AppBridge.getTasks() : (window.currentTasks || []);
      var task = tasks.find(function(t) { return (t.id === taskId || t.taskId === taskId); });
      this.showTaskFormModal(task);
    },

    /**
     * Unified Task Form Modal (Create or Edit)
     */
    showTaskFormModal: function(taskToEdit) {
      var isEdit = !!taskToEdit;
      var modalEl = document.getElementById('task-form-modal');
      if (!modalEl) {
        modalEl = createFormModal();
        document.body.appendChild(modalEl);
      }

      var modalTitle = modalEl.querySelector('#form-modal-title');
      if (modalTitle) modalTitle.textContent = isEdit ? ('Chỉnh sửa nhiệm vụ #' + taskToEdit.id) : 'Thêm nhiệm vụ mới';

      // Populate form fields
      var form = modalEl.querySelector('#task-editor-form');
      form.reset();

      if (isEdit) {
        form.querySelector('#form-title').value = taskToEdit.title || '';
        form.querySelector('#form-topic').value = taskToEdit.topic || '';
        form.querySelector('#form-deadline').value = taskToEdit.deadline || '';
        form.querySelector('#form-status').value = taskToEdit.status || 'todo';
        form.querySelector('#form-priority').value = taskToEdit.priority || 'medium';
        form.querySelector('#form-description').value = taskToEdit.description || '';
      } else {
        form.querySelector('#form-status').value = 'todo';
        form.querySelector('#form-priority').value = 'medium';
      }

      // Track resources array for form
      var currentResources = isEdit && Array.isArray(taskToEdit.resources) ? JSON.parse(JSON.stringify(taskToEdit.resources)) : [];

      var resourceSectionEl = modalEl.querySelector('#form-resource-manager-container');
      if (resourceSectionEl && window.ResourceManager) {
        window.ResourceManager.renderFormManager(currentResources, resourceSectionEl, function(updatedResources) {
          currentResources = updatedResources;
        });
      }

      var bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

      // Save Form Submit
      form.onsubmit = async function(e) {
        e.preventDefault();
        var feedbackEl = modalEl.querySelector('#form-save-feedback');
        var saveButton = form.querySelector('button[type="submit"]');
        var originalButtonHtml = saveButton.innerHTML;

        if (feedbackEl) {
          feedbackEl.className = 'alert d-none mb-3';
          feedbackEl.textContent = '';
        }

        var cleanedResources;
        try {
          cleanedResources = normalizeResourcesForSave(currentResources);
        } catch (validationError) {
          showFormFeedback(feedbackEl, 'danger', validationError.message);
          return;
        }

        var payload = {
          title: form.querySelector('#form-title').value.trim(),
          topic: form.querySelector('#form-topic').value.trim(),
          deadline: form.querySelector('#form-deadline').value,
          status: form.querySelector('#form-status').value,
          priority: form.querySelector('#form-priority').value,
          description: form.querySelector('#form-description').value.trim(),
          resources: cleanedResources
        };

        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Đang lưu...';

        try {
          if (!window.TaskFirestore) throw new Error('TASK_STORAGE_UNAVAILABLE');

          if (isEdit) {
            await window.TaskFirestore.updateTask(taskToEdit.id, payload);
          } else {
            await window.TaskFirestore.createTask(payload);
          }

          var successMessage = 'Đã lưu nhiệm vụ thành công.';
          if (window.AppBridge) {
            try {
              await window.AppBridge.reloadTasks();
            } catch (reloadError) {
              console.warn('[V1] TASK_SAVED_REFRESH_FAILED', reloadError);
              successMessage = 'Đã lưu nhiệm vụ. Hãy tải lại trang để cập nhật bảng.';
            }
          }
          showFormFeedback(feedbackEl, 'success', successMessage);
          TaskUI.showOperationFeedback('success', successMessage);
          window.setTimeout(function() { bsModal.hide(); }, 350);
        } catch (saveError) {
          console.error('[V1] TASK_SAVE_FAILED', saveError);
          showFormFeedback(feedbackEl, 'danger', getSaveErrorMessage(saveError));
        } finally {
          saveButton.disabled = false;
          saveButton.innerHTML = originalButtonHtml;
        }
      };

      bsModal.show();
    }
  };

  function createDetailModal() {
    var modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'task-detail-modal';
    modal.tabIndex = -1;
    modal.innerHTML = '<div class="modal-dialog modal-lg modal-dialog-centered">' +
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<h5 class="modal-title" id="detail-modal-title">Chi tiết nhiệm vụ</h5>' +
          '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
        '</div>' +
        '<div class="modal-body" id="detail-modal-body"></div>' +
      '</div>' +
    '</div>';
    return modal;
  }

  function createFormModal() {
    var modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'task-form-modal';
    modal.tabIndex = -1;
    modal.innerHTML = '<div class="modal-dialog modal-lg modal-dialog-centered">' +
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<h5 class="modal-title" id="form-modal-title">Tạo / Chỉnh sửa nhiệm vụ</h5>' +
          '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<form id="task-editor-form">' +
            '<div class="row g-3 mb-3">' +
              '<div class="col-md-8">' +
                '<label class="form-label font-weight-bold">Tiêu đề nhiệm vụ (*)</label>' +
                '<input type="text" class="form-control" id="form-title" required>' +
              '</div>' +
              '<div class="col-md-4">' +
                '<label class="form-label font-weight-bold">Chủ đề (*)</label>' +
                '<input type="text" class="form-control" id="form-topic" required>' +
              '</div>' +
            '</div>' +
            '<div class="row g-3 mb-3">' +
              '<div class="col-md-4">' +
                '<label class="form-label font-weight-bold">Hạn nộp (*)</label>' +
                '<input type="date" class="form-control" id="form-deadline" required>' +
              '</div>' +
              '<div class="col-md-4">' +
                '<label class="form-label font-weight-bold">Trạng thái (*)</label>' +
                '<select class="form-select" id="form-status">' +
                  '<option value="todo">Cần làm</option>' +
                  '<option value="doing">Đang thực hiện</option>' +
                  '<option value="review">Đang kiểm tra</option>' +
                  '<option value="done">Hoàn thành</option>' +
                '</select>' +
              '</div>' +
              '<div class="col-md-4">' +
                '<label class="form-label font-weight-bold">Độ ưu tiên (*)</label>' +
                '<select class="form-select" id="form-priority">' +
                  '<option value="low">Thấp</option>' +
                  '<option value="medium" selected>Trung bình</option>' +
                  '<option value="high">Cao</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="mb-3">' +
              '<label class="form-label font-weight-bold">Mô tả chi tiết</label>' +
              '<textarea class="form-control" id="form-description" rows="3"></textarea>' +
            '</div>' +
            '<div id="form-resource-manager-container"></div>' +
            '<div id="form-save-feedback" class="alert d-none mb-3" role="status" aria-live="polite"></div>' +
            '<div class="modal-footer px-0 pb-0 mt-3">' +
              '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>' +
              '<button type="submit" class="btn btn-danger" style="background-color: #D32F2F; border-color: #D32F2F;">Lưu nhiệm vụ</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>' +
    '</div>';
    return modal;
  }

  function normalizeResourcesForSave(resources) {
    return (Array.isArray(resources) ? resources : []).reduce(function(cleaned, resource) {
      var title = String(resource.title || '').trim();
      var url = String(resource.url || '').trim();

      // Clicking "add resource" and leaving the whole row blank should not
      // poison an otherwise valid task save.
      if (!title && !url) return cleaned;

      if (!title || !url) {
        throw new Error('Mỗi tài liệu cần có đủ tiêu đề và đường dẫn URL, hoặc hãy xóa dòng đang để dở.');
      }

      if (!/^https:\/\//i.test(url)) {
        throw new Error('Đường dẫn tài liệu phải bắt đầu bằng https://');
      }

      var normalized = Object.assign({}, resource, {
        title: title,
        url: url,
        order: cleaned.length
      });
      cleaned.push(normalized);
      return cleaned;
    }, []);
  }

  function showFormFeedback(feedbackEl, type, message) {
    if (!feedbackEl) return;
    feedbackEl.className = 'alert alert-' + type + ' mb-3';
    feedbackEl.textContent = message;
    feedbackEl.scrollIntoView({ block: 'nearest' });
  }

  function getSaveErrorMessage(error) {
    var code = error && error.code ? String(error.code) : '';
    if (code === 'v1/backend-contract-not-ready') {
      return 'Firebase Test Project chưa kích hoạt Rules/backfill V1 cho tài liệu, trạng thái Review hoặc lifecycle. Các trường Core vẫn có thể lưu; hãy bỏ tài liệu V1 hoặc chọn trạng thái Core.';
    }
    if (code.indexOf('permission-denied') !== -1) {
      return 'Firebase từ chối quyền ghi. Dữ liệu chưa được lưu; vui lòng kiểm tra Rules và vai trò Teacher.';
    }
    if (code === 'v1/task-not-found') {
      return 'Không tìm thấy nhiệm vụ cần cập nhật. Hãy tải lại trang rồi thử lại.';
    }
    return 'Không thể lưu nhiệm vụ. Dữ liệu chưa thay đổi; vui lòng thử lại.';
  }

  window.TaskUI = TaskUI;
})(window);
