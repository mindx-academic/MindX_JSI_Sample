/* JSI 2026 Optional Extensions V4 - Task Detail Controller (AI Teacher Assistant Integration) */

(function(window) {
  'use strict';

  function formatCommentDate(cmt) {
    if (!cmt) return '';
    if (cmt.createdAtMs) {
      return new Date(cmt.createdAtMs).toLocaleString('vi-VN');
    }
    if (cmt.createdAt) {
      if (typeof cmt.createdAt.toDate === 'function') {
        return cmt.createdAt.toDate().toLocaleString('vi-VN');
      }
      if (typeof cmt.createdAt.seconds === 'number') {
        return new Date(cmt.createdAt.seconds * 1000).toLocaleString('vi-VN');
      }
      if (typeof cmt.createdAt === 'string') {
        var d = new Date(cmt.createdAt);
        if (!isNaN(d.getTime())) return d.toLocaleString('vi-VN');
      }
    }
    return new Date().toLocaleString('vi-VN');
  }

  var TaskDetailController = {
    /**
     * Mounts the Tab Container inside Task Detail modal/panel
     */
    mountContainer: function(task, containerEl, initialTab) {
      if (!containerEl || !task) return;
      var activeTabId = initialTab || 'resources';
      var currentUser = window.AppBridge ? window.AppBridge.getCurrentUser() : { uid: 'anon', role: 'student', name: 'Học viên' };
      var role = (window.AppBridge && typeof window.AppBridge.getCurrentRole === 'function')
        ? window.AppBridge.getCurrentRole()
        : (currentUser ? currentUser.role : 'student');

      if (currentUser && !currentUser.role) {
        currentUser.role = role;
      }

      var isTeacher = (role === 'teacher');
      var submissionLabel = isTeacher ? 'Quản lý Bài nộp' : 'Nộp bài & Tệp';

      containerEl.innerHTML = '';

      var wrapper = document.createElement('div');
      wrapper.className = 'task-detail-unified-wrapper';

      // Navigation Bar (V4: Teacher receives Tab 6 "Trợ lý AI")
      var aiTabButtonHtml = isTeacher
        ? '<button type="button" class="tab-nav-btn ' + (activeTabId === 'ai' ? 'active' : '') + '" data-tab="ai"><i class="bi bi-stars text-danger me-1"></i> Trợ lý AI <span class="badge bg-danger ms-1">V4</span></button>'
        : '';

      var tabsNavHtml = '<div class="task-detail-tabs-nav">' +
        '<button type="button" class="tab-nav-btn ' + (activeTabId === 'overview' ? 'active' : '') + '" data-tab="overview"><i class="bi bi-info-circle me-1"></i> Tổng quan</button>' +
        '<button type="button" class="tab-nav-btn ' + (activeTabId === 'resources' ? 'active' : '') + '" data-tab="resources"><i class="bi bi-folder2-open me-1"></i> Tài liệu <span class="badge bg-secondary ms-1">' + (task.resources ? task.resources.length : 0) + '</span></button>' +
        '<button type="button" class="tab-nav-btn ' + (activeTabId === 'comments' ? 'active' : '') + '" data-tab="comments"><i class="bi bi-chat-left-text me-1"></i> Bình luận <span class="badge bg-primary ms-1" id="v3-comment-count-badge">0</span></button>' +
        '<button type="button" class="tab-nav-btn ' + (activeTabId === 'progress' ? 'active' : '') + '" data-tab="progress"><i class="bi bi-bar-chart-steps me-1"></i> Tiến độ <span class="badge bg-info text-dark ms-1">V2</span></button>' +
        '<button type="button" class="tab-nav-btn ' + (activeTabId === 'submission' ? 'active' : '') + '" data-tab="submission"><i class="bi bi-cloud-arrow-up me-1"></i> ' + submissionLabel + ' <span class="badge bg-success ms-1">V3</span></button>' +
        aiTabButtonHtml +
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

      // Pane 2: Resources
      var resourcesPane = document.createElement('div');
      resourcesPane.className = 'tab-pane-content ' + (activeTabId === 'resources' ? 'active' : '');
      resourcesPane.setAttribute('data-pane', 'resources');
      if (window.ResourceManager) {
        window.ResourceManager.renderResourceList(task.resources || [], resourcesPane);
      }
      panesContainer.appendChild(resourcesPane);

      // Pane 3: Comments
      var commentsPane = document.createElement('div');
      commentsPane.className = 'tab-pane-content ' + (activeTabId === 'comments' ? 'active' : '');
      commentsPane.setAttribute('data-pane', 'comments');
      this.renderCommentsPane(task, commentsPane, currentUser);
      panesContainer.appendChild(commentsPane);

      // Pane 4: Progress
      var progressPane = document.createElement('div');
      progressPane.className = 'tab-pane-content ' + (activeTabId === 'progress' ? 'active' : '');
      progressPane.setAttribute('data-pane', 'progress');
      this.renderProgressPane(task, progressPane, currentUser);
      panesContainer.appendChild(progressPane);

      // Pane 5: Submission
      var submissionPane = document.createElement('div');
      submissionPane.className = 'tab-pane-content ' + (activeTabId === 'submission' ? 'active' : '');
      submissionPane.setAttribute('data-pane', 'submission');
      this.renderSubmissionPane(task, submissionPane, currentUser);
      panesContainer.appendChild(submissionPane);

      // Pane 6: AI Teacher Assistant (TEACHER ROLE ONLY)
      if (isTeacher) {
        var aiPane = document.createElement('div');
        aiPane.className = 'tab-pane-content ' + (activeTabId === 'ai' ? 'active' : '');
        aiPane.setAttribute('data-pane', 'ai');
        panesContainer.appendChild(aiPane);

        if (activeTabId === 'ai' && window.AIAssistantController) {
          window.AIAssistantController.renderAITabContent(aiPane, task.id);
        }
      }

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
          if (pane) {
            pane.classList.add('active');
            if (targetTab === 'ai' && isTeacher && window.AIAssistantController) {
              window.AIAssistantController.renderAITabContent(pane, task.id);
            }
          }
        };
      });
    },

    // Render V2 Comments Pane
    renderCommentsPane: function(task, paneEl, currentUser) {
      paneEl.innerHTML = '<div class="v2-comments-container p-2">' +
        '<div class="v2-comments-form mb-3">' +
          '<div class="input-group">' +
            '<textarea class="form-control" id="v3-comment-input" rows="2" placeholder="Viết bình luận hoặc đặt câu hỏi... (tối đa 2000 ký tự)"></textarea>' +
            '<button class="btn btn-primary" type="button" id="v3-send-comment-btn"><i class="bi bi-send me-1"></i> Gửi</button>' +
          '</div>' +
          '<div id="v3-comment-form-error" class="text-danger small mt-1"></div>' +
        '</div>' +
        '<div id="v3-comments-list" class="v2-comments-list"><div class="text-muted small"><span class="spinner-border spinner-border-sm me-2" role="status"></span>Đang tải bình luận...</div></div>' +
      '</div>';

      var inputEl = paneEl.querySelector('#v3-comment-input');
      var sendBtn = paneEl.querySelector('#v3-send-comment-btn');
      var errorEl = paneEl.querySelector('#v3-comment-form-error');
      var listEl = paneEl.querySelector('#v3-comments-list');

      function loadComments() {
        if (!window.CommentsManager) return;
        listEl.innerHTML = '<div class="text-muted small p-2"><span class="spinner-border spinner-border-sm me-2" role="status"></span>Đang tải bình luận...</div>';
        window.CommentsManager.fetchComments(task.id, function(err, comments) {
          if (err) {
            var badgeErr = document.getElementById('v3-comment-count-badge');
            if (badgeErr) badgeErr.innerText = '0';
            listEl.innerHTML = '<div class="alert alert-danger py-2 mb-0 small"><i class="bi bi-exclamation-triangle me-1"></i>' + escapeHtml(err.message || 'Không thể tải bình luận. Vui lòng thử lại.') + '</div>';
            return;
          }
          comments = comments || [];
          var badge = document.getElementById('v3-comment-count-badge');
          if (badge) badge.innerText = comments.length;

          if (comments.length === 0) {
            listEl.innerHTML = '<div class="text-muted small italic p-3 text-center bg-light rounded">Chưa có bình luận nào.</div>';
            return;
          }
          listEl.innerHTML = '';
          comments.forEach(function(cmt) {
            var cmtItem = document.createElement('div');
            cmtItem.className = 'v2-comment-card p-2 border-bottom mb-2 bg-white rounded shadow-sm';
            
            var isAuthorTeacher = cmt.authorRole === 'teacher' || (cmt.authorEmail && cmt.authorEmail.indexOf('teacher') !== -1);
            var roleBadgeHtml = isAuthorTeacher 
              ? '<span class="badge bg-danger ms-1">Giáo viên</span>' 
              : '<span class="badge bg-secondary ms-1">Học viên</span>';

            var isDeletable = window.CommentsManager.isDeletable(cmt, currentUser);

            var actionsHtml = '';
            if (isDeletable) {
              actionsHtml += '<button type="button" class="btn btn-sm btn-link text-danger p-0 ms-2 btn-del-cmt" title="Xóa bình luận"><i class="bi bi-trash"></i> Xóa</button>';
            }

            cmtItem.innerHTML = '<div class="d-flex justify-content-between align-items-center mb-1">' +
              '<div><strong>' + escapeHtml(cmt.authorName || cmt.authorEmail) + '</strong>' + roleBadgeHtml + '</div>' +
              '<div class="text-muted small">' + escapeHtml(formatCommentDate(cmt)) + actionsHtml + '</div>' +
            '</div>' +
            '<div class="text-dark" style="white-space: pre-wrap;">' + window.CommentsManager.linkifyText(cmt.text) + '</div>';

            if (isDeletable) {
              var delBtn = cmtItem.querySelector('.btn-del-cmt');
              if (delBtn) {
                delBtn.onclick = function() {
                  var confirmOptions = {
                    title: 'Xóa bình luận',
                    message: 'Bạn có chắc chắn muốn xóa bình luận này?',
                    confirmText: 'Xóa',
                    confirmBtnClass: 'btn-danger'
                  };

                  var doDelete = function() {
                    window.CommentsManager.deleteComment(task.id, cmt.id, cmt, currentUser, function(errDel) {
                      if (errDel) {
                        if (window.TaskUI) window.TaskUI.showOperationFeedback('error', errDel.message);
                      } else {
                        if (window.TaskUI) window.TaskUI.showOperationFeedback('success', 'Đã xóa bình luận.');
                        loadComments();
                      }
                    });
                  };

                  if (window.TaskUI && typeof window.TaskUI.showConfirmModal === 'function') {
                    window.TaskUI.showConfirmModal(confirmOptions, doDelete);
                  } else {
                    doDelete();
                  }
                };
              }
            }

            listEl.appendChild(cmtItem);
          });
        });
      }

      sendBtn.onclick = function() {
        errorEl.innerText = '';
        var text = inputEl.value.trim();
        if (!text) return;
        window.CommentsManager.addComment(task.id, text, currentUser, function(errAdd) {
          if (errAdd) {
            errorEl.innerText = errAdd.message;
            return;
          }
          inputEl.value = '';
          if (window.TaskUI) window.TaskUI.showOperationFeedback('success', 'Đã gửi bình luận.');
          loadComments();
        });
      };

      loadComments();
    },

    // Render V2 Progress Pane
    renderProgressPane: function(task, paneEl, currentUser) {
      var role = (window.AppBridge && typeof window.AppBridge.getCurrentRole === 'function')
        ? window.AppBridge.getCurrentRole()
        : (currentUser ? currentUser.role : 'student');
      var studentUid = currentUser ? currentUser.uid : 'anon';

      if (role === 'teacher') {
        paneEl.innerHTML = '<div class="v3-progress-container p-2">' +
          '<div class="d-flex align-items-center justify-content-between mb-1">' +
            '<h6 class="mb-0 text-dark fw-bold"><i class="bi bi-bar-chart-steps me-2 text-danger"></i>Tiến độ học viên <span class="badge bg-secondary ms-2 text-white" style="font-size: 0.7rem; font-weight: 500;">Chỉ xem</span></h6>' +
          '</div>' +
          '<div class="text-muted small mb-3">Theo dõi tiến độ cá nhân của học viên trong nhiệm vụ này.</div>' +
          '<div id="v3-teacher-prog-summary" class="row row-cols-2 row-cols-md-4 g-2 mb-3"></div>' +
          '<div id="v3-teacher-prog-list"><div class="text-muted small p-3 text-center bg-light rounded"><span class="spinner-border spinner-border-sm me-2" role="status"></span>Đang tải tiến độ...</div></div>' +
        '</div>';

        var summaryEl = paneEl.querySelector('#v3-teacher-prog-summary');
        var listEl = paneEl.querySelector('#v3-teacher-prog-list');

        if (window.ProgressTracker) {
          window.ProgressTracker.getClassOverview(task.id, function(err, records) {
            records = records || [];

            var counts = { not_started: 0, in_progress: 0, need_help: 0, completed: 0 };
            records.forEach(function(r) {
              var st = r.status || 'not_started';
              if (counts[st] !== undefined) counts[st]++;
              else counts.not_started++;
            });

            summaryEl.innerHTML = 
              '<div class="col"><div class="border rounded p-2 text-center bg-light shadow-sm"><div class="text-muted small fw-medium">Chưa bắt đầu</div><div class="fs-5 fw-bold text-secondary">' + counts.not_started + '</div></div></div>' +
              '<div class="col"><div class="border border-primary-subtle rounded p-2 text-center bg-primary-subtle shadow-sm"><div class="text-primary small fw-medium">Đang thực hiện</div><div class="fs-5 fw-bold text-primary">' + counts.in_progress + '</div></div></div>' +
              '<div class="col"><div class="border border-warning-subtle rounded p-2 text-center bg-warning-subtle shadow-sm"><div class="text-warning-emphasis small fw-medium">Cần hỗ trợ</div><div class="fs-5 fw-bold text-warning-emphasis">' + counts.need_help + '</div></div></div>' +
              '<div class="col"><div class="border border-success-subtle rounded p-2 text-center bg-success-subtle shadow-sm"><div class="text-success-emphasis small fw-medium">Hoàn thành</div><div class="fs-5 fw-bold text-success-emphasis">' + counts.completed + '</div></div></div>';

            if (records.length === 0) {
              listEl.innerHTML = '<div class="text-center p-4 bg-light rounded border border-dashed mb-0">' +
                '<i class="bi bi-bar-chart-steps text-muted display-6 d-block mb-2"></i>' +
                '<div class="fw-bold text-secondary">Chưa có dữ liệu tiến độ từ học viên.</div>' +
              '</div>';
              return;
            }

            listEl.innerHTML = '';
            records.forEach(function(r) {
              var stMap = {
                'not_started': { label: 'Chưa bắt đầu', badgeClass: 'bg-secondary text-white' },
                'in_progress': { label: 'Đang thực hiện', badgeClass: 'bg-primary text-white' },
                'need_help':   { label: 'Cần hỗ trợ',   badgeClass: 'bg-warning text-dark' },
                'completed':   { label: 'Hoàn thành',   badgeClass: 'bg-success text-white' }
              };

              var stInfo = stMap[r.status] || { label: r.status || 'Chưa bắt đầu', badgeClass: 'bg-secondary text-white' };
              var name = r.studentName || (r.studentEmail ? r.studentEmail.split('@')[0] : 'Học viên');
              var email = r.studentEmail || '';
              var initials = name.substring(0, 2).toUpperCase();

              var card = document.createElement('div');
              card.className = 'border rounded p-3 mb-2 bg-white shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-2';
              card.innerHTML = '<div class="d-flex align-items-center gap-3">' +
                '<div class="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 40px; height: 40px; font-size: 0.9rem; flex-shrink: 0;">' + escapeHtml(initials) + '</div>' +
                '<div><div class="fw-bold text-dark fs-6">' + escapeHtml(name) + '</div>' + (email ? '<div class="text-muted small"><i class="bi bi-envelope me-1"></i>' + escapeHtml(email) + '</div>' : '') + '</div>' +
              '</div>' +
              '<div class="d-flex align-items-center gap-3 ms-auto ms-sm-0">' +
                '<span class="badge ' + stInfo.badgeClass + ' px-3 py-2 fs-6 shadow-sm">' + escapeHtml(stInfo.label) + '</span>' +
              '</div>';

              listEl.appendChild(card);
            });
          });
        }
      } else {
        // Student Progress
        paneEl.innerHTML = '<div class="p-2">' +
          '<h6>Cập nhật tiến độ cá nhân:</h6>' +
          '<div id="v3-student-prog-status" class="alert alert-secondary py-2 mb-3">Đang tải tiến độ...</div>' +
          '<div class="d-flex gap-2 flex-wrap mt-2" id="v3-prog-pills">' +
            '<button class="btn btn-sm btn-outline-secondary pill" data-s="not_started">Chưa bắt đầu</button>' +
            '<button class="btn btn-sm btn-outline-primary pill" data-s="in_progress">Đang thực hiện</button>' +
            '<button class="btn btn-sm btn-outline-warning pill" data-s="need_help">Cần hỗ trợ</button>' +
            '<button class="btn btn-sm btn-outline-success pill" data-s="completed">Hoàn thành</button>' +
          '</div>' +
        '</div>';

        var statusBox = paneEl.querySelector('#v3-student-prog-status');
        var container = paneEl.querySelector('#v3-prog-pills');

        function loadProg() {
          if (!window.ProgressTracker) return;
          window.ProgressTracker.getStudentProgress(task.id, studentUid, function(err, prog) {
            var st = prog ? prog.status : 'not_started';
            var stInfo = window.ProgressTracker.STATUS_MAP[st] || { label: st };
            statusBox.className = 'alert alert-info py-2 mb-3';
            statusBox.innerHTML = 'Trạng thái tiến độ hiện tại: <strong>' + escapeHtml(stInfo.label) + '</strong>';

            container.querySelectorAll('.pill').forEach(function(btn) {
              if (btn.getAttribute('data-s') === st) {
                btn.classList.remove('btn-outline-secondary', 'btn-outline-primary', 'btn-outline-warning', 'btn-outline-success');
                btn.classList.add('btn-primary', 'active');
              } else {
                btn.classList.remove('btn-primary', 'active');
              }
            });
          });
        }

        container.querySelectorAll('.pill').forEach(function(btn) {
          btn.onclick = function() {
            var st = btn.getAttribute('data-s');
            window.ProgressTracker.setStudentProgress(task.id, studentUid, st, currentUser, function(errSet) {
              if (errSet) {
                if (window.TaskUI) window.TaskUI.showOperationFeedback('error', errSet.message);
              } else {
                if (window.TaskUI) window.TaskUI.showOperationFeedback('success', 'Đã cập nhật tiến độ.');
                loadProg();
              }
            });
          };
        });

        loadProg();
      }
    },

    // Render V3 Cloudinary Submission Pane (Teacher Feedback + AI Suggestion Button + Session Cache Restoration)
    renderSubmissionPane: function(task, paneEl, currentUser) {
      var role = (window.AppBridge && typeof window.AppBridge.getCurrentRole === 'function')
        ? window.AppBridge.getCurrentRole()
        : (currentUser ? currentUser.role : 'student');

      if (role === 'teacher') {
        paneEl.innerHTML = '<div class="v3-submission-container p-2">' +
          '<h6 class="mb-3"><i class="bi bi-journal-check me-1"></i> Bài nộp của học viên:</h6>' +
          '<div id="v3-teacher-submissions-list"><div class="text-muted small"><span class="spinner-border spinner-border-sm me-2" role="status"></span>Đang tải bài nộp...</div></div>' +
        '</div>';

        var listEl = paneEl.querySelector('#v3-teacher-submissions-list');
        
        function loadTeacherSubmissions() {
          if (!window.SubmissionManager) return;
          listEl.innerHTML = '<div class="text-muted small p-2"><span class="spinner-border spinner-border-sm me-2" role="status"></span>Đang tải danh sách bài nộp...</div>';
          window.SubmissionManager.getClassSubmissions(task.id, function(err, subs) {
            if (err) {
              listEl.innerHTML = '<div class="alert alert-danger py-2 mb-0 small"><i class="bi bi-exclamation-triangle me-1"></i>' + escapeHtml(err.message || 'Không thể tải danh sách bài nộp. Vui lòng thử lại.') + '</div>';
              return;
            }
            if (!subs || subs.length === 0) {
              listEl.innerHTML = '<div class="text-muted small italic p-3 text-center bg-light rounded">Chưa có học viên nào nộp bài cho nhiệm vụ này.</div>';
              return;
            }

            listEl.innerHTML = '';
            subs.forEach(function(sub) {
              var stInfo = window.SubmissionManager.STATUS_MAP[sub.status] || window.SubmissionManager.STATUS_MAP['not_submitted'];
              var item = document.createElement('div');
              item.className = 'border rounded p-3 mb-3 bg-white shadow-sm';
              
              // Normalize files (supports sub.files or sub.attachments array)
              var rawFiles = (sub.files && sub.files.length) ? sub.files : (sub.attachments || []);
              var filesHtml = '<span class="text-muted small">Không có tệp đính kèm.</span>';
              
              if (rawFiles && rawFiles.length > 0) {
                filesHtml = rawFiles.map(function(f) {
                  var fname = escapeHtml(f.originalFilename || f.name || 'tệp đính kèm');
                  var rawUrl = f.secureUrl || f.url || '';
                  var isZip = (f.format === 'zip') || (fname.toLowerCase().indexOf('.zip') !== -1);
                  var isPdf = (f.format === 'pdf') || (fname.toLowerCase().indexOf('.pdf') !== -1);
                  var label = isZip ? 'Tải xuống' : (isPdf ? 'Xem PDF' : 'Xem tệp');
                  var icon = isZip ? 'bi-download' : (isPdf ? 'bi-file-earmark-pdf' : 'bi-eye');
                  
                  var finalUrl = rawUrl;
                  if (isZip && rawUrl && rawUrl.indexOf('/image/upload/') !== -1 && rawUrl.indexOf('/fl_attachment/') === -1) {
                    finalUrl = rawUrl.replace('/image/upload/', '/image/upload/fl_attachment/');
                  }

                  var link = finalUrl ? '<a href="' + finalUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary ms-2"><i class="bi ' + icon + ' me-1"></i>' + label + '</a>' : '';
                  var fsize = Math.round((f.bytes || f.size || 0) / 1024) + ' KB';
                  return '<div class="d-flex align-items-center justify-content-between p-2 bg-light border rounded mb-1 small">' +
                    '<div><i class="bi bi-cloud-arrow-up text-primary me-1"></i><strong>' + fname + '</strong> <span class="text-muted">(' + fsize + ')</span></div>' +
                    link +
                  '</div>';
                }).join('');
              }

              // Normalize links (supports sub.links array or sub.link string)
              var rawLinks = (sub.links && sub.links.length) ? sub.links : (sub.link ? [sub.link] : []);
              var linksHtml = 'Không có';
              if (rawLinks && rawLinks.length > 0) {
                linksHtml = rawLinks.map(function(l) {
                  return '<a href="' + l + '" target="_blank" rel="noopener noreferrer" class="text-decoration-none"><i class="bi bi-link-45deg me-1"></i>' + escapeHtml(l) + '</a>';
                }).join(', ');
              }

              item.innerHTML = '<div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">' +
                '<div>' +
                  '<h6 class="mb-0 text-primary"><i class="bi bi-person-badge me-1"></i>' + escapeHtml(sub.studentName || 'Học viên') + '</h6>' +
                  '<span class="text-muted small">' + escapeHtml(sub.studentEmail || '') + '</span>' +
                '</div>' +
                '<span class="badge ' + stInfo.badgeClass + ' fs-6">' + stInfo.label + '</span>' +
              '</div>' +
              '<div class="mb-2"><strong>Thời gian nộp:</strong> <span class="text-muted">' + escapeHtml(sub.updatedAt ? new Date(sub.updatedAt).toLocaleString('vi-VN') : 'N/A') + '</span></div>' +
              '<div class="mb-2"><strong>Ghi chú từ Học viên:</strong> <span class="text-secondary">' + escapeHtml(sub.notes || 'Không có') + '</span></div>' +
              '<div class="mb-3"><strong>Liên kết sản phẩm / GitHub:</strong> <div>' + linksHtml + '</div></div>' +
              '<div class="mb-3"><strong>Tệp đính kèm:</strong><div class="mt-1">' + filesHtml + '</div></div>' +
              
              // Feedback & AI Contextual Suggestion Section
              '<div class="border-top pt-3 bg-light p-3 rounded">' +
                '<div class="d-flex justify-content-between align-items-center mb-2">' +
                  '<label class="form-label small fw-bold text-dark mb-0"><i class="bi bi-pencil-square me-1"></i>Nhận xét & Phản hồi của Giáo viên:</label>' +
                  '<button class="btn btn-sm btn-outline-danger px-2 py-0 btn-ai-feedback-suggest" style="font-size: 0.78rem;">' +
                    '<span class="spinner-border spinner-border-sm me-1 d-none ai-fb-spin"></span><i class="bi bi-stars me-1"></i>Gợi ý từ AI' +
                  '</button>' +
                '</div>' +
                '<div class="ai-feedback-draft-area d-none mb-2"></div>' +
                '<textarea class="form-control form-control-sm mb-2 feedback-text" rows="2" placeholder="Nhập nhận xét hoặc lý do yêu cầu sửa đổi bài nộp...">' + escapeHtml(sub.teacherFeedback || '') + '</textarea>' +
                '<div class="d-flex justify-content-end gap-2">' +
                  '<button class="btn btn-sm btn-outline-danger btn-request-revision"><i class="bi bi-exclamation-triangle me-1"></i>Yêu cầu sửa lại</button>' +
                  '<button class="btn btn-sm btn-success btn-approve-submission"><i class="bi bi-check-circle me-1"></i>Đánh dấu hoàn thành</button>' +
                '</div>' +
              '</div>';

              var fbInput = item.querySelector('.feedback-text');
              var aiSuggestBtn = item.querySelector('.btn-ai-feedback-suggest');
              var aiSpin = item.querySelector('.ai-fb-spin');
              var aiDraftArea = item.querySelector('.ai-feedback-draft-area');

              function renderDraftContent(d) {
                if (!d) return;
                aiDraftArea.className = 'ai-feedback-draft-area alert alert-light border border-danger mb-2 p-2 small';
                aiDraftArea.innerHTML = '<div class="fw-bold text-danger mb-1"><i class="bi bi-stars me-1"></i>Bản thảo gợi ý từ AI:</div>' +
                  '<div class="mb-2 text-dark" style="white-space: pre-wrap;">' + escapeHtml(d.feedbackDraft || '') + '</div>' +
                  '<div class="d-flex justify-content-end">' +
                    '<button class="btn btn-sm btn-danger px-3 py-1 btn-apply-ai-draft"><i class="bi bi-input-cursor-text me-1"></i>Chèn vào ô nhận xét</button>' +
                  '</div>';
                aiDraftArea.classList.remove('d-none');

                var applyBtn = aiDraftArea.querySelector('.btn-apply-ai-draft');
                if (applyBtn) {
                  applyBtn.onclick = function() {
                    fbInput.value = d.feedbackDraft || '';
                    aiDraftArea.classList.add('d-none');
                    fbInput.focus();
                  };
                }
              }

              // Restore AI Feedback Suggestion from sessionStorage if present
              if (window.BYOKManager) {
                var cachedFeedback = window.BYOKManager.getAICache('feedback_suggestion_' + task.id + '_' + sub.studentUid);
                if (cachedFeedback) {
                  renderDraftContent(cachedFeedback);
                }
              }

              // AI Feedback Suggestion Button Handler
              aiSuggestBtn.onclick = async function() {
                if (!window.AIAssistantController) return;
                aiSpin.classList.remove('d-none');
                aiSuggestBtn.disabled = true;

                try {
                  var res = await window.AIAssistantController.requestFeedbackSuggestion(task.id, sub.studentUid);
                  if (res.error) {
                    aiDraftArea.className = 'ai-feedback-draft-area alert alert-danger mb-2 p-2 small';
                    aiDraftArea.textContent = res.error;
                    aiDraftArea.classList.remove('d-none');
                    return;
                  }
                  renderDraftContent(res.data);
                } catch (err) {
                  aiDraftArea.className = 'ai-feedback-draft-area alert alert-danger mb-2 p-2 small';
                  aiDraftArea.textContent = 'Không thể lấy gợi ý phản hồi: ' + (err.message || 'Lỗi không xác định.');
                  aiDraftArea.classList.remove('d-none');
                } finally {
                  aiSpin.classList.add('d-none');
                  aiSuggestBtn.disabled = false;
                }
              };

              item.querySelector('.btn-request-revision').onclick = function() {
                window.SubmissionManager.saveTeacherFeedback(task.id, sub.studentUid, 'needs_revision', fbInput.value, currentUser, function(err2) {
                  if (err2) {
                    if (window.TaskUI) window.TaskUI.showOperationFeedback('error', err2.message);
                  } else {
                    if (window.TaskUI) window.TaskUI.showOperationFeedback('success', 'Đã gửi yêu cầu chỉnh sửa.');
                    loadTeacherSubmissions();
                  }
                });
              };
              item.querySelector('.btn-approve-submission').onclick = function() {
                window.SubmissionManager.saveTeacherFeedback(task.id, sub.studentUid, 'completed', fbInput.value, currentUser, function(err2) {
                  if (err2) {
                    if (window.TaskUI) window.TaskUI.showOperationFeedback('error', err2.message);
                  } else {
                    if (window.TaskUI) window.TaskUI.showOperationFeedback('success', 'Đã đánh dấu bài nộp hoàn thành.');
                    loadTeacherSubmissions();
                  }
                });
              };

              listEl.appendChild(item);
            });
          });
        }

        loadTeacherSubmissions();
      } else {
        // Student Submission Form
        paneEl.innerHTML = '<div class="v3-submission-container p-2">' +
          '<div id="v3-student-sub-status" class="alert alert-secondary py-2 mb-3">Đang tải trạng thái bài nộp...</div>' +
          '<form id="v3-submission-form">' +
            '<div class="mb-3">' +
              '<label class="form-label small fw-bold">Liên kết sản phẩm / GitHub / Figma (URL):</label>' +
              '<input type="url" class="form-control form-control-sm" id="v3-sub-link" placeholder="https://github.com/username/project">' +
            '</div>' +
            '<div class="mb-3">' +
              '<label class="form-label small fw-bold">Ghi chú cho Giáo viên:</label>' +
              '<textarea class="form-control form-control-sm" id="v3-sub-notes" rows="3" placeholder="Mô tả công việc đã hoàn thành hoặc thắc mắc..."></textarea>' +
            '</div>' +
            '<div class="mb-3">' +
              '<label class="form-label small fw-bold">Tệp đính kèm (Tối đa 3 tệp, 5MB/tệp: JPEG, PNG, GIF, WebP, PDF, ZIP):</label>' +
              '<input type="file" class="form-control form-control-sm" id="v3-sub-file-input" accept="image/*,.pdf,.zip">' +
              '<div id="v3-file-meta-list" class="mt-2"></div>' +
            '</div>' +
            '<div id="v3-sub-error-msg" class="text-danger small mb-2"></div>' +
            '<div class="d-flex justify-content-end gap-2">' +
              '<button type="button" class="btn btn-outline-secondary btn-sm" id="v3-btn-save-draft"><i class="bi bi-save me-1"></i>Lưu bản nháp</button>' +
              '<button type="button" class="btn btn-primary btn-sm" id="v3-btn-submit-final"><i class="bi bi-send-check me-1"></i>Nộp bài chính thức</button>' +
            '</div>' +
          '</form>' +
        '</div>';

        var statusEl = paneEl.querySelector('#v3-student-sub-status');
        var linkInput = paneEl.querySelector('#v3-sub-link');
        var notesInput = paneEl.querySelector('#v3-sub-notes');
        var fileInput = paneEl.querySelector('#v3-sub-file-input');
        var fileListEl = paneEl.querySelector('#v3-file-meta-list');
        var errorMsg = paneEl.querySelector('#v3-sub-error-msg');
        var btnDraft = paneEl.querySelector('#v3-btn-save-draft');
        var btnSubmit = paneEl.querySelector('#v3-btn-submit-final');

        var currentFilesMeta = [];

        function renderFileList() {
          if (!currentFilesMeta || currentFilesMeta.length === 0) {
            fileListEl.innerHTML = '<span class="text-muted small italic">Chưa có tệp đính kèm nào.</span>';
            return;
          }
          fileListEl.innerHTML = '';
          currentFilesMeta.forEach(function(f, idx) {
            var item = document.createElement('div');
            item.className = 'd-flex align-items-center justify-content-between p-2 bg-light border rounded mb-1 small';
            var fname = escapeHtml(f.originalFilename || f.name);
            var fsize = Math.round((f.bytes || f.size || 0) / 1024) + ' KB';
            
            var isZip = (f.format === 'zip') || (fname.toLowerCase().indexOf('.zip') !== -1);
            var isPdf = (f.format === 'pdf') || (fname.toLowerCase().indexOf('.pdf') !== -1);
            var label = isZip ? 'Tải xuống' : (isPdf ? 'Xem PDF' : 'Xem');
            var icon = isZip ? 'bi-download' : (isPdf ? 'bi-file-earmark-pdf' : 'bi-eye');
            
            var rawUrl = f.secureUrl || f.url || '';
            var finalUrl = rawUrl;
            if (isZip && rawUrl && rawUrl.indexOf('/image/upload/') !== -1 && rawUrl.indexOf('/fl_attachment/') === -1) {
              finalUrl = rawUrl.replace('/image/upload/', '/image/upload/fl_attachment/');
            }
            
            var link = finalUrl ? '<a href="' + finalUrl + '" target="_blank" rel="noopener noreferrer" class="ms-1 text-decoration-none"><i class="bi ' + icon + '"></i> ' + label + '</a>' : '';
            
            item.innerHTML = '<div><i class="bi bi-cloud-check text-success me-1"></i><strong>' + fname + '</strong> <span class="text-muted">(' + fsize + ')</span> ' + link + '</div>' +
              '<button type="button" class="btn btn-sm btn-link text-danger p-0 ms-2 btn-del-file" data-idx="' + idx + '"><i class="bi bi-trash"></i> Xóa</button>';

            item.querySelector('.btn-del-file').onclick = function() {
              var targetFile = currentFilesMeta[idx];
              if (targetFile && targetFile.publicId) {
                window.SubmissionManager.deleteCloudinaryAsset(targetFile.publicId, currentUser.uid, task.id, function(errDel) {
                  if (errDel) {
                    errorMsg.innerText = errDel.message;
                  }
                  currentFilesMeta.splice(idx, 1);
                  renderFileList();
                });
              } else {
                currentFilesMeta.splice(idx, 1);
                renderFileList();
              }
            };
            fileListEl.appendChild(item);
          });
        }

        fileInput.onchange = function() {
          errorMsg.innerText = '';
          if (fileInput.files && fileInput.files[0]) {
            var f = fileInput.files[0];

            if (currentFilesMeta.length >= window.SubmissionManager.MAX_FILES_PER_SUBMISSION) {
              errorMsg.innerText = 'Mỗi bài nộp chỉ được đính kèm tối đa 3 tệp.';
              fileInput.value = '';
              return;
            }
            if (f.size > window.SubmissionManager.MAX_FILE_SIZE) {
              errorMsg.innerText = 'Tệp vượt quá giới hạn 5 MB.';
              fileInput.value = '';
              return;
            }
            if (window.SubmissionManager.ALLOWED_TYPES.indexOf(f.type) === -1) {
              errorMsg.innerText = 'Định dạng tệp không được hỗ trợ.';
              fileInput.value = '';
              return;
            }

            errorMsg.innerText = 'Đang tải tệp lên...';
            window.SubmissionManager.uploadFileToCloudinary(f, currentUser.uid, task.id, currentFilesMeta.length, function(err, fileMeta) {
              fileInput.value = '';
              if (err) {
                errorMsg.innerText = err.message;
                return;
              }
              errorMsg.innerText = '';
              currentFilesMeta.push(fileMeta);
              renderFileList();
            });
          }
        };

        function loadStudentSub() {
          if (!window.SubmissionManager) return;
          window.SubmissionManager.getSubmission(task.id, currentUser.uid, function(err, sub) {
            if (!sub) {
              statusEl.className = 'alert alert-secondary py-2 mb-3';
              statusEl.innerHTML = '<i class="bi bi-info-circle me-1"></i>Trạng thái bài nộp: <strong>Chưa nộp</strong>';
              renderFileList();
              return;
            }

            var stInfo = window.SubmissionManager.STATUS_MAP[sub.status] || window.SubmissionManager.STATUS_MAP['not_submitted'];
            statusEl.className = 'alert ' + (sub.status === 'completed' ? 'alert-success' : (sub.status === 'needs_revision' ? 'alert-danger' : 'alert-primary')) + ' py-2 mb-3';
            
            var fbText = sub.teacherFeedback ? '<div class="mt-2 pt-2 border-top"><strong>Phản hồi từ Giáo viên:</strong> ' + escapeHtml(sub.teacherFeedback) + '</div>' : '';
            statusEl.innerHTML = '<div>Trạng thái bài nộp: <span class="badge ' + stInfo.badgeClass + '">' + stInfo.label + '</span></div>' + fbText;

            var rawLinks = (sub.links && sub.links[0]) ? sub.links[0] : (sub.link || '');
            if (rawLinks) linkInput.value = rawLinks;
            if (sub.notes) notesInput.value = sub.notes;
            
            var rawFiles = (sub.files && sub.files.length) ? sub.files : (sub.attachments || []);
            if (rawFiles && rawFiles.length) {
              currentFilesMeta = rawFiles;
            }
            renderFileList();
          });
        }

        function handleSave(isFinal) {
          errorMsg.innerText = '';
          var links = linkInput.value.trim() ? [linkInput.value.trim()] : [];
          var notes = notesInput.value.trim();

          window.SubmissionManager.saveStudentSubmission(task.id, currentUser, isFinal, links, notes, currentFilesMeta, function(err, sub) {
            if (err) {
              errorMsg.innerText = err.message;
              return;
            }
            if (window.TaskUI) {
              window.TaskUI.showOperationFeedback('success', isFinal ? 'Nộp bài thành công.' : 'Đã lưu bản nháp bài nộp.');
            }
            loadStudentSub();
          });
        }

        btnDraft.onclick = function() { handleSave(false); };
        btnSubmit.onclick = function() { handleSave(true); };

        loadStudentSub();
      }
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.TaskDetailController = TaskDetailController;
})(window);
