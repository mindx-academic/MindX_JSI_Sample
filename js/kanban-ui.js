/* JSI 2026 Optional Extensions V1 - Kanban Board UI Component */

(function(window) {
  'use strict';

  var KanbanUI = {
    /**
     * Renders the complete V1 Kanban Board inside the target container.
     */
    render: function(containerEl) {
      if (!containerEl) return;
      var tasks = window.AppBridge ? window.AppBridge.getTasks() : (window.currentTasks || []);
      var role = window.AppBridge ? window.AppBridge.getCurrentRole() : (window.currentRole || 'public');

      // Normalize tasks
      if (window.TaskSchemaAdapter) {
        tasks = window.TaskSchemaAdapter.normalizeTaskList(tasks);
      }

      containerEl.innerHTML = '';

      var boardWrapper = document.createElement('div');
      boardWrapper.className = 'kanban-board-wrapper';

      // Header Bar
      var isTeacher = (role === 'teacher');
      var isStudent = (role === 'student');
      var isPublic = (role === 'public');

      var headerHtml = '';
      
      if (isPublic) {
        headerHtml += '<div class="welcome-banner">' +
          '<h2>Chào mừng đến với hệ thống bảng nhiệm vụ Public (Dữ liệu mẫu)</h2>' +
          '<p>Vui lòng đăng nhập để xem dữ liệu lớp học trực tuyến.</p>' +
        '</div>';
      }

      headerHtml += '<div class="kanban-board-header">' +
        '<div class="kanban-board-title"><i class="bi bi-kanban me-2"></i>Bảng nhiệm vụ (Kanban)</div>';

      if (isTeacher) {
        headerHtml += '<button type="button" class="btn btn-danger btn-sm" id="kanban-add-task-btn"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i><span>Thêm nhiệm vụ</span></button>';
      }
      headerHtml += '</div>';

      if (isStudent) {
        headerHtml += '<div class="alert alert-info py-2 px-3 mb-3 small">' +
          '<i class="bi bi-info-circle me-1"></i> Bạn chỉ có quyền xem chi tiết và tương tác bài tập. Không có quyền tạo hoặc chỉnh sửa nhiệm vụ.' +
        '</div>';
      }

      boardWrapper.innerHTML = headerHtml;

      // Filter tasks by lifecycleState
      // Student ONLY sees active tasks.
      var activeTasks = tasks.filter(function(t) {
        return !t.lifecycleState || t.lifecycleState === 'active';
      });

      var archivedTasks = isTeacher ? tasks.filter(function(t) {
        return t.lifecycleState === 'archived';
      }) : [];

      // 4 Columns Grid
      var columnsGrid = document.createElement('div');
      columnsGrid.className = 'kanban-columns-container';

      var columnsDef = [
        { id: 'todo', title: 'Cần làm', icon: 'bi-circle' },
        { id: 'doing', title: 'Đang thực hiện', icon: 'bi-arrow-repeat' },
        { id: 'review', title: 'Đang kiểm tra', icon: 'bi-search' },
        { id: 'done', title: 'Hoàn thành', icon: 'bi-check-circle' }
      ];

      columnsDef.forEach(function(col) {
        var colTasks = activeTasks.filter(function(t) { return t.status === col.id; });
        var colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.setAttribute('data-status', col.id);

        var colHeaderHtml = '<div class="kanban-column-header">' +
          '<div class="column-title-wrap">' +
            '<i class="bi ' + col.icon + '"></i>' +
            '<span class="column-title">' + col.title + '</span>' +
          '</div>' +
          '<span class="column-count-badge">' + colTasks.length + '</span>' +
        '</div>';

        colEl.innerHTML = colHeaderHtml;
        var cardsList = document.createElement('div');
        cardsList.className = 'kanban-cards-list';

        if (colTasks.length === 0) {
          cardsList.innerHTML = '<div class="text-center text-muted small py-4 opacity-50">Không có nhiệm vụ</div>';
        } else {
          colTasks.forEach(function(task) {
            cardsList.appendChild(renderTaskCard(task, role));
          });
        }

        colEl.appendChild(cardsList);

        // V1.1 Teacher Drag & Drop Column Event Handlers
        if (isTeacher) {
          colEl.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            colEl.classList.add('drag-over');
          });

          colEl.addEventListener('dragleave', function(e) {
            if (!colEl.contains(e.relatedTarget)) {
              colEl.classList.remove('drag-over');
            }
          });

          colEl.addEventListener('drop', async function(e) {
            e.preventDefault();
            colEl.classList.remove('drag-over');

            var taskId = e.dataTransfer.getData('text/plain') || window.currentDraggedTaskId;
            var targetStatus = col.id;
            var sourceStatus = window.currentDraggedSourceStatus;

            if (!taskId) return;
            if (targetStatus === sourceStatus) {
              // Same-column drop: NO Firestore write, NO reload
              return;
            }

            console.log('[KANBAN DND] Teacher dropped task #' + taskId + ' from ' + sourceStatus + ' -> ' + targetStatus);

            // Optimistic UI Placement: Move card DOM element immediately to target cardsList
            var draggedCardEl = boardWrapper.querySelector('.kanban-card[data-task-id="' + taskId + '"]');
            var targetCardsList = colEl.querySelector('.kanban-cards-list');
            if (draggedCardEl && targetCardsList) {
              // Remove empty msg if present in target column
              var emptyMsg = targetCardsList.querySelector('.opacity-50');
              if (emptyMsg) emptyMsg.remove();
              targetCardsList.appendChild(draggedCardEl);
            }

            try {
              if (window.TaskFirestore && typeof window.TaskFirestore.updateTask === 'function') {
                await window.TaskFirestore.updateTask(taskId, { status: targetStatus });
                if (window.AppBridge) await window.AppBridge.reloadTasks();
                if (window.TaskUI) window.TaskUI.showOperationFeedback('success', 'Đã chuyển trạng thái nhiệm vụ.');
              }
            } catch (err) {
              console.error('[KANBAN DND ERROR]', err);
              if (window.TaskUI) window.TaskUI.showOperationFeedback('error', 'Không thể cập nhật trạng thái nhiệm vụ. Vui lòng thử lại.');
              if (window.AppBridge) await window.AppBridge.reloadTasks();
            } finally {
              window.currentDraggedTaskId = null;
              window.currentDraggedSourceStatus = null;
            }
          });
        }

        columnsGrid.appendChild(colEl);
      });

      boardWrapper.appendChild(columnsGrid);

      // Render Archived Section for Teacher ONLY
      if (isTeacher) {
        var archiveContainer = document.createElement('div');
        archiveContainer.className = 'archived-section-container';

        var archiveHeaderHtml = '<div class="archived-section-header" id="toggle-archive-btn">' +
          '<div class="archived-section-title">' +
            '<i class="bi bi-archive-fill text-secondary"></i> Khu vực Lưu trữ (Archived)' +
            '<span class="badge bg-secondary ms-2">' + archivedTasks.length + '</span>' +
          '</div>' +
          '<i class="bi bi-chevron-down toggle-icon"></i>' +
        '</div>';

        archiveContainer.innerHTML = archiveHeaderHtml;
        var archiveContent = document.createElement('div');
        archiveContent.className = 'archived-section-content';

        if (archivedTasks.length === 0) {
          archiveContent.innerHTML = '<div class="text-muted small py-2">Không có nhiệm vụ nào trong lưu trữ.</div>';
        } else {
          archivedTasks.forEach(function(task) {
            archiveContent.appendChild(renderArchivedCard(task));
          });
        }

        archiveContainer.appendChild(archiveContent);
        boardWrapper.appendChild(archiveContainer);

        // Bind Archive Toggle
        archiveContainer.querySelector('#toggle-archive-btn').onclick = function() {
          archiveContainer.classList.toggle('open');
          var icon = archiveContainer.querySelector('.toggle-icon');
          if (icon) {
            icon.classList.toggle('bi-chevron-down');
            icon.classList.toggle('bi-chevron-up');
          }
        };
      }

      containerEl.appendChild(boardWrapper);

      // Bind Teacher Add Task Button
      if (isTeacher) {
        var addBtn = boardWrapper.querySelector('#kanban-add-task-btn');
        if (addBtn) {
          addBtn.onclick = function() {
            if (window.TaskUI && typeof window.TaskUI.showCreateModal === 'function') {
              window.TaskUI.showCreateModal();
            }
          };
        }
      }
    }
  };

  /**
   * Helper: Render Task Card
   */
  function renderTaskCard(task, role) {
    var isTeacher = (role === 'teacher');
    var card = document.createElement('div');
    card.className = 'kanban-card';
    card.setAttribute('data-task-id', task.id || task.taskId);

    var resCount = Array.isArray(task.resources) ? task.resources.length : 0;

    var dragHandleHtml = isTeacher 
      ? '<span class="drag-handle-grip text-secondary me-2" title="Kéo để đổi trạng thái" aria-label="Kéo để đổi trạng thái"><i class="bi bi-grip-vertical" aria-hidden="true"></i></span>' 
      : '';

    var html = '<div class="kanban-card-header">' +
      '<div class="d-flex align-items-center">' +
        dragHandleHtml +
        '<span class="task-id-badge">#' + escapeHtml(task.id || 'T') + '</span>' +
      '</div>' +
      '<span class="task-priority-dot ' + (task.priority || 'medium') + '" title="Độ ưu tiên: ' + (task.priority || 'medium') + '"></span>' +
    '</div>' +
    '<div class="kanban-card-title">' + escapeHtml(task.title) + '</div>' +
    '<div class="kanban-card-topic">' + escapeHtml(task.topic) + '</div>' +
    '<div class="kanban-card-footer">' +
      '<div class="kanban-card-meta">' +
        '<span class="meta-item"><i class="bi bi-calendar3"></i> ' + escapeHtml(task.deadline || 'N/A') + '</span>' +
        (resCount > 0 ? '<span class="meta-item text-primary"><i class="bi bi-paperclip"></i> ' + resCount + ' tài liệu</span>' : '') +
      '</div>';

    if (isTeacher) {
      html += '<div class="kanban-card-actions">' +
        '<button type="button" class="card-action-btn edit-task-btn" title="Chỉnh sửa nhiệm vụ" aria-label="Chỉnh sửa nhiệm vụ" data-id="' + task.id + '"><i class="bi bi-pencil-fill" aria-hidden="true"></i></button>' +
        '<button type="button" class="card-action-btn archive-task-btn" title="Lưu trữ nhiệm vụ" aria-label="Lưu trữ nhiệm vụ" data-id="' + task.id + '"><i class="bi bi-archive-fill" aria-hidden="true"></i></button>' +
      '</div>';
    }

    html += '</div>';
    card.innerHTML = html;

    // Card click opens Task Detail (suppressed immediately after drag drop)
    card.onclick = function(e) {
      if (window.isDraggingJustFinished) return; // ignore click triggered by drag release
      if (e.target.closest('.card-action-btn')) return; // ignore action button clicks
      if (window.AppBridge) {
        window.AppBridge.openTaskDetail(task.id || task.taskId);
      }
    };

    // V1.1 Teacher Drag & Drop Card Attributes
    if (isTeacher) {
      card.setAttribute('draggable', 'true');

      card.addEventListener('dragstart', function(e) {
        window.currentDraggedTaskId = task.id || task.taskId;
        window.currentDraggedSourceStatus = task.status;
        window.isDraggingJustFinished = false;
        try {
          e.dataTransfer.setData('text/plain', task.id || task.taskId);
        } catch(err) {
          // dataTransfer fallback
        }
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('is-dragging');
      });

      card.addEventListener('dragend', function() {
        card.classList.remove('is-dragging');
        document.querySelectorAll('.kanban-column.drag-over').forEach(function(el) {
          el.classList.remove('drag-over');
        });
        window.isDraggingJustFinished = true;
        setTimeout(function() {
          window.isDraggingJustFinished = false;
        }, 300);
      });
    }

    // Teacher Card Action Handlers
    if (isTeacher) {
      var editBtn = card.querySelector('.edit-task-btn');
      if (editBtn) {
        editBtn.onclick = function(e) {
          e.stopPropagation();
          if (window.TaskUI && typeof window.TaskUI.showEditModal === 'function') {
            window.TaskUI.showEditModal(task.id);
          }
        };
      }

      var archiveBtn = card.querySelector('.archive-task-btn');
      if (archiveBtn) {
        archiveBtn.onclick = function(e) {
          e.stopPropagation();
          var confirmOptions = {
            title: 'Lưu trữ nhiệm vụ',
            message: 'Bạn có chắc chắn muốn chuyển nhiệm vụ này vào Khu vực Lưu trữ (Archived)?',
            confirmText: 'Lưu trữ',
            confirmBtnClass: 'btn-danger'
          };
          
          var doArchive = async function() {
            try {
              if (window.TaskFirestore && typeof window.TaskFirestore.archiveTask === 'function') {
                await window.TaskFirestore.archiveTask(task.id);
                if (window.AppBridge) await window.AppBridge.reloadTasks();
                if (window.TaskUI) window.TaskUI.showOperationFeedback('success', 'Đã lưu trữ nhiệm vụ.');
              }
            } catch (error) {
              console.error('[V1] TASK_ARCHIVE_FAILED', error);
              if (window.TaskUI) window.TaskUI.showOperationFeedback('error', 'Chưa thể lưu trữ nhiệm vụ. Vui lòng thử lại.');
            }
          };

          if (window.TaskUI && typeof window.TaskUI.showConfirmModal === 'function') {
            window.TaskUI.showConfirmModal(confirmOptions, doArchive);
          } else {
            doArchive();
          }
        };
      }

    }

    return card;
  }

  /**
   * Helper: Render Archived Task Card
   */
  function renderArchivedCard(task) {
    var card = document.createElement('div');
    card.className = 'kanban-card archived-card';
    card.setAttribute('data-task-id', task.id);

    var html = '<div class="kanban-card-header">' +
      '<span class="task-id-badge">#' + escapeHtml(task.id) + '</span>' +
      '<span class="badge bg-secondary">Archived</span>' +
    '</div>' +
    '<div class="kanban-card-title text-muted">' + escapeHtml(task.title) + '</div>' +
    '<div class="kanban-card-footer">' +
      '<span class="small text-muted">Hạn: ' + escapeHtml(task.deadline) + '</span>' +
      '<div class="d-flex gap-2">' +
        '<button type="button" class="btn btn-sm btn-outline-primary restore-task-btn" data-id="' + task.id + '"><i class="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>Khôi phục</button>' +
        '<button type="button" class="btn btn-sm btn-outline-danger soft-delete-archived-btn" data-id="' + task.id + '"><i class="bi bi-trash-fill me-1" aria-hidden="true"></i>Xóa mềm</button>' +
      '</div>' +
    '</div>';

    card.innerHTML = html;

    var restoreBtn = card.querySelector('.restore-task-btn');
    if (restoreBtn) {
      restoreBtn.onclick = async function(e) {
        e.stopPropagation();
        try {
          if (window.TaskFirestore && typeof window.TaskFirestore.unarchiveTask === 'function') {
            await window.TaskFirestore.unarchiveTask(task.id);
            if (window.AppBridge) await window.AppBridge.reloadTasks();
            if (window.TaskUI) window.TaskUI.showOperationFeedback('success', 'Đã khôi phục nhiệm vụ.');
          }
        } catch (error) {
          console.error('[V1] TASK_RESTORE_FAILED', error);
          if (window.TaskUI) window.TaskUI.showOperationFeedback('error', 'Chưa thể khôi phục: lifecycle V1 chưa được kích hoạt trên Firebase Test Project.');
        }
      };
    }

    var deleteBtn = card.querySelector('.soft-delete-archived-btn');
    if (deleteBtn) {
      deleteBtn.onclick = function(e) {
        e.stopPropagation();
        var confirmOptions = {
          title: 'Chuyển vào thùng rác',
          message: 'Bạn có chắc chắn muốn chuyển nhiệm vụ đã lưu trữ này vào thùng rác trong 30 ngày?',
          confirmText: 'Xóa mềm',
          confirmBtnClass: 'btn-danger'
        };

        var doDelete = async function() {
          try {
            if (window.TaskFirestore && typeof window.TaskFirestore.softDeleteTask === 'function') {
              await window.TaskFirestore.softDeleteTask(task.id);
              if (window.AppBridge) await window.AppBridge.reloadTasks();
              if (window.TaskUI) window.TaskUI.showOperationFeedback('success', 'Đã chuyển nhiệm vụ vào thùng rác 30 ngày.');
            }
          } catch (error) {
            console.error('[V1] TASK_DELETE_FAILED', error);
            if (window.TaskUI) window.TaskUI.showOperationFeedback('error', 'Chưa thể xóa mềm nhiệm vụ. Vui lòng thử lại.');
          }
        };

        if (window.TaskUI && typeof window.TaskUI.showConfirmModal === 'function') {
          window.TaskUI.showConfirmModal(confirmOptions, doDelete);
        } else {
          doDelete();
        }
      };
    }

    return card;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.KanbanUI = KanbanUI;
})(window);
