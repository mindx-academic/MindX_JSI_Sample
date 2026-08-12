/* JSI 2026 Optional Extensions V1 - Task Detail Controller */

(function(window) {
  'use strict';

  var TaskDetailController = {
    /**
     * Mounts the 5-Tab Container inside Task Detail modal/panel
     */
    mountContainer: function(task, containerEl, initialTab) {
      if (!containerEl || !task) return;
      var activeTabId = initialTab || 'resources';
      var role = window.AppBridge ? window.AppBridge.getCurrentRole() : (window.currentRole || 'public');
      var submissionLabel = role === 'teacher' ? 'Bài nộp' : 'Nộp bài';

      containerEl.innerHTML = '';

      var wrapper = document.createElement('div');
      wrapper.className = 'task-detail-unified-wrapper';

      // 5-Tab Navigation Bar
      var tabsNavHtml = '<div class="task-detail-tabs-nav">' +
        '<button type="button" class="tab-nav-btn ' + (activeTabId === 'overview' ? 'active' : '') + '" data-tab="overview"><i class="bi bi-info-circle me-1"></i> Tổng quan</button>' +
        '<button type="button" class="tab-nav-btn ' + (activeTabId === 'resources' ? 'active' : '') + '" data-tab="resources"><i class="bi bi-folder2-open me-1"></i> Tài liệu <span class="badge bg-secondary ms-1">' + (task.resources ? task.resources.length : 0) + '</span></button>' +
        '<button type="button" class="tab-nav-btn future-feature" data-tab="comments" title="Xem phạm vi Bình luận dự kiến ở V2"><i class="bi bi-chat-left-text me-1"></i> Bình luận <span class="placeholder-badge">V2</span></button>' +
        '<button type="button" class="tab-nav-btn future-feature" data-tab="progress" title="Xem phạm vi Tiến độ dự kiến ở V2"><i class="bi bi-bar-chart-steps me-1"></i> Tiến độ <span class="placeholder-badge">V2</span></button>' +
        '<button type="button" class="tab-nav-btn future-feature" data-tab="submission" title="Xem phạm vi Bài nộp dự kiến ở V3"><i class="bi bi-upload me-1"></i> ' + submissionLabel + ' <span class="placeholder-badge">V3</span></button>' +
      '</div>';

      wrapper.innerHTML = tabsNavHtml;

      // Tab Content Panes Container
      var panesContainer = document.createElement('div');
      panesContainer.className = 'task-detail-tab-panes';

      // Pane 1: Overview
      var overviewPane = document.createElement('div');
      overviewPane.className = 'tab-pane-content ' + (activeTabId === 'overview' ? 'active' : '');
      overviewPane.setAttribute('data-pane', 'overview');
      overviewPane.innerHTML = '<div class="p-3 bg-light rounded mb-3">' +
        '<h6>Mô tả nhiệm vụ:</h6>' +
        '<p class="text-secondary" style="white-space: pre-wrap;">' + escapeHtml(task.description || 'Chưa có mô tả chi tiết.') + '</p>' +
      '</div>' +
      '<div class="row g-2 text-muted small">' +
        '<div class="col-6">Chủ đề: <strong>' + escapeHtml(task.topic) + '</strong></div>' +
        '<div class="col-6">Hạn nộp: <strong>' + escapeHtml(task.deadline) + '</strong></div>' +
        '<div class="col-6">Độ ưu tiên: <strong>' + escapeHtml(task.priority) + '</strong></div>' +
        '<div class="col-6">Trạng thái: <strong>' + escapeHtml(task.status) + '</strong></div>' +
      '</div>';
      panesContainer.appendChild(overviewPane);

      // Pane 2: Resources (Active V1 Feature)
      var resourcesPane = document.createElement('div');
      resourcesPane.className = 'tab-pane-content ' + (activeTabId === 'resources' ? 'active' : '');
      resourcesPane.setAttribute('data-pane', 'resources');
      if (window.ResourceManager) {
        window.ResourceManager.renderResourceList(task.resources || [], resourcesPane);
      }
      panesContainer.appendChild(resourcesPane);

      // Pane 3: Comments (V2 Disabled Placeholder)
      var commentsPane = document.createElement('div');
      commentsPane.className = 'tab-pane-content ' + (activeTabId === 'comments' ? 'active' : '');
      commentsPane.setAttribute('data-pane', 'comments');
      commentsPane.innerHTML = '<div class="tab-placeholder-card">' +
        '<div class="placeholder-icon"><i class="bi bi-chat-dots"></i></div>' +
        '<h6>Tính năng Trao đổi Bình luận Lớp học</h6>' +
        '<p class="mb-1">' + (role === 'teacher'
          ? 'Ở V2, Giáo viên có thể xem, phản hồi và kiểm duyệt bình luận dưới từng nhiệm vụ.'
          : 'Ở V2, Học viên có thể trao đổi và đặt câu hỏi dưới từng nhiệm vụ.') + '</p>' +
        '<span class="placeholder-badge">Nội dung mở rộng V2 - Chưa kích hoạt</span>' +
      '</div>';
      panesContainer.appendChild(commentsPane);

      // Pane 4: Progress (V2 Disabled Placeholder)
      var progressPane = document.createElement('div');
      progressPane.className = 'tab-pane-content ' + (activeTabId === 'progress' ? 'active' : '');
      progressPane.setAttribute('data-pane', 'progress');
      progressPane.innerHTML = '<div class="tab-placeholder-card">' +
        '<div class="placeholder-icon"><i class="bi bi-sliders"></i></div>' +
        '<h6>Tính năng Theo dõi Tiến độ Cá nhân</h6>' +
        '<p class="mb-1">' + (role === 'teacher'
          ? 'Ở V2, Giáo viên có thể theo dõi trạng thái làm bài của học viên trong lớp.'
          : 'Ở V2, Học viên có thể cập nhật trạng thái và ghi chú tiến độ cá nhân.') + '</p>' +
        '<span class="placeholder-badge">Nội dung mở rộng V2 - Chưa kích hoạt</span>' +
      '</div>';
      panesContainer.appendChild(progressPane);

      // Pane 5: Submission (V3 Disabled Placeholder)
      var submissionPane = document.createElement('div');
      submissionPane.className = 'tab-pane-content ' + (activeTabId === 'submission' ? 'active' : '');
      submissionPane.setAttribute('data-pane', 'submission');
      submissionPane.innerHTML = '<div class="tab-placeholder-card">' +
        '<div class="placeholder-icon"><i class="bi bi-cloud-arrow-up"></i></div>' +
        '<h6>' + (role === 'teacher' ? 'Tính năng Quản lý Bài nộp' : 'Tính năng Nộp bài & Upload Tệp') + '</h6>' +
        '<p class="mb-1">' + (role === 'teacher'
          ? 'Ở V3, Giáo viên có thể xem bài nộp, phản hồi và yêu cầu học viên chỉnh sửa.'
          : 'Ở V3, Học viên có thể nộp link hoặc tệp tối đa 5MB và nhận phản hồi.') + '</p>' +
        '<span class="placeholder-badge">Nội dung mở rộng V3 - Chưa kích hoạt</span>' +
      '</div>';
      panesContainer.appendChild(submissionPane);

      wrapper.appendChild(panesContainer);
      containerEl.appendChild(wrapper);

      // Bind Tab Navigation Clicks
      wrapper.querySelectorAll('.tab-nav-btn').forEach(function(btn) {
        btn.onclick = function() {
          var targetTab = btn.getAttribute('data-tab');

          wrapper.querySelectorAll('.tab-nav-btn').forEach(function(b) { b.classList.remove('active'); });
          wrapper.querySelectorAll('.tab-pane-content').forEach(function(p) { p.classList.remove('active'); });

          btn.classList.add('active');
          var pane = wrapper.querySelector('.tab-pane-content[data-pane="' + targetTab + '"]');
          if (pane) pane.classList.add('active');
        };
      });
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.TaskDetailController = TaskDetailController;
})(window);
