(function() {
  'use strict';

  var AIAssistantController = {

    renderAITabContent: function(container, taskId) {
      if (!container) return;

      var role = window.AppBridge ? window.AppBridge.getCurrentRole() : (window.currentRole || 'student');
      if (role !== 'teacher') {
        container.innerHTML = '<div class="alert alert-warning m-3">Trợ lý AI chỉ dành cho tài khoản Giáo viên.</div>';
        return;
      }

      if (!window.BYOKManager || !window.BYOKManager.hasKey()) {
        this.renderKeyForm(container, taskId);
      } else {
        this.renderAIWorkspace(container, taskId);
      }
    },

    renderKeyForm: function(container, taskId) {
      var self = this;
      container.innerHTML =
        '<div class="p-3">' +
          '<div class="card shadow-sm border-0 mb-3">' +
            '<div class="card-body p-4">' +
              '<h5 class="card-title text-danger mb-2">' +
                '<i class="bi bi-robot me-2"></i>Kích hoạt Trợ lý AI Giáo viên (Gemini BYOK)' +
              '</h5>' +
              '<p class="text-muted small mb-3">' +
                'Vui lòng nhập API key Gemini cá nhân của bạn để sử dụng các tính năng trợ lý AI (Tóm tắt nhiệm vụ, Gợi ý nhận xét, Phát hiện học viên cần hỗ trợ).' +
              '</p>' +
              '<div id="byok-alert-area" class="alert d-none mb-3" role="alert"></div>' +
              '<div class="input-group mb-3">' +
                '<input type="password" id="byok-key-input" class="form-control" placeholder="AIzaSy... (Gemini API Key)" autocomplete="off">' +
                '<button class="btn btn-danger px-4" id="byok-save-btn">' +
                  '<span class="spinner-border spinner-border-sm me-2 d-none" id="byok-spin"></span>' +
                  'Kiểm tra kết nối & Lưu' +
                '</button>' +
              '</div>' +
              '<div class="form-text small text-muted">' +
                '<i class="bi bi-shield-lock me-1"></i>Bảo mật: Key chỉ lưu trong <code>sessionStorage</code> trình duyệt phiên làm việc hiện tại, tự động xóa khi đóng tab/đăng xuất và không bao giờ lưu trữ trên server/database.' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      var btn = container.querySelector('#byok-save-btn');
      var input = container.querySelector('#byok-key-input');
      var alertArea = container.querySelector('#byok-alert-area');
      var spin = container.querySelector('#byok-spin');

      btn.addEventListener('click', async function() {
        var val = input.value ? input.value.trim() : '';
        if (!val) {
          alertArea.className = 'alert alert-danger mb-3';
          alertArea.textContent = 'Vui lòng nhập Gemini API key.';
          alertArea.classList.remove('d-none');
          return;
        }

        spin.classList.remove('d-none');
        btn.disabled = true;
        alertArea.classList.add('d-none');

        var testRes = await window.BYOKManager.validateKeyOnline(val);
        spin.classList.add('d-none');
        btn.disabled = false;

        if (testRes.success) {
          window.BYOKManager.setKey(val);
          self.renderAIWorkspace(container, taskId);
        } else {
          alertArea.className = 'alert alert-danger mb-3';
          alertArea.textContent = testRes.message || 'Kết nối thất bại. Vui lòng kiểm tra lại API key.';
          alertArea.classList.remove('d-none');
        }
      });
    },

    renderAIWorkspace: function(container, taskId) {
      var self = this;
      var maskedKey = window.BYOKManager ? window.BYOKManager.getMaskedKey() : '••••••••';

      container.innerHTML =
        '<div class="p-3">' +
          // Header & Key Actions
          '<div class="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">' +
            '<div>' +
              '<h6 class="mb-1 text-danger fw-bold"><i class="bi bi-stars me-2"></i>Trợ lý AI Giáo viên (Gemini BYOK)</h6>' +
              '<span class="badge bg-light text-dark border"><i class="bi bi-key me-1"></i>Key: ' + maskedKey + '</span>' +
            '</div>' +
            '<div>' +
              '<button class="btn btn-sm btn-outline-secondary me-2" id="ai-change-key-btn"><i class="bi bi-pencil me-1"></i>Thay API Key</button>' +
              '<button class="btn btn-sm btn-outline-danger" id="ai-clear-key-btn"><i class="bi bi-trash me-1"></i>Xóa khỏi phiên</button>' +
            '</div>' +
          '</div>' +

          '<div id="ai-workspace-alert" class="alert d-none mb-3"></div>' +

          // Action 1: Tóm tắt tình hình
          '<div class="card shadow-sm border-0 mb-3">' +
            '<div class="card-header bg-white fw-bold d-flex justify-content-between align-items-center py-2">' +
              '<span><i class="bi bi-journal-text me-2 text-primary"></i>Tóm tắt tình hình nhiệm vụ</span>' +
              '<button class="btn btn-sm btn-primary px-3" id="ai-summary-btn">' +
                '<span class="spinner-border spinner-border-sm me-1 d-none" id="summary-spin"></span>Phân tích tóm tắt' +
              '</button>' +
            '</div>' +
            '<div class="card-body" id="ai-summary-result">' +
              '<p class="text-muted small mb-0">Bấm "Phân tích tóm tắt" để AI tổng hợp tiến độ, bài nộp và bình luận nhiệm vụ này.</p>' +
            '</div>' +
          '</div>' +

          // Action 2: Phát hiện học viên cần hỗ trợ
          '<div class="card shadow-sm border-0 mb-3">' +
            '<div class="card-header bg-white fw-bold d-flex justify-content-between align-items-center py-2">' +
              '<span><i class="bi bi-person-exclamation me-2 text-warning"></i>Phát hiện học viên cần hỗ trợ</span>' +
              '<button class="btn btn-sm btn-warning px-3" id="ai-support-btn">' +
                '<span class="spinner-border spinner-border-sm me-1 d-none" id="support-spin"></span>Quét danh sách' +
              '</button>' +
            '</div>' +
            '<div class="card-body" id="ai-support-result">' +
              '<p class="text-muted small mb-0">Bấm "Quét danh sách" để AI tổng hợp các học viên gắn cờ cần hỗ trợ hoặc có bài làm yêu cầu chỉnh sửa.</p>' +
            '</div>' +
          '</div>' +

          // Footer Disclaimer
          '<div class="text-center text-muted small mt-3 py-2 border-top">' +
            '<i class="bi bi-info-circle me-1"></i>Gợi ý từ AI – Giáo viên cần xem xét trước khi sử dụng.' +
          '</div>' +
        '</div>';

      // Event listeners
      container.querySelector('#ai-change-key-btn').addEventListener('click', function() {
        self.renderKeyForm(container, taskId);
      });

      container.querySelector('#ai-clear-key-btn').addEventListener('click', function() {
        window.BYOKManager.clearKey();
        self.renderKeyForm(container, taskId);
      });

      container.querySelector('#ai-summary-btn').addEventListener('click', function() {
        self.runTaskSummary(container, taskId);
      });

      container.querySelector('#ai-support-btn').addEventListener('click', function() {
        self.runSupportDetection(container, taskId);
      });
    },

    runTaskSummary: async function(container, taskId) {
      var spin = container.querySelector('#summary-spin');
      var btn = container.querySelector('#ai-summary-btn');
      var resultArea = container.querySelector('#ai-summary-result');
      var alertArea = container.querySelector('#ai-workspace-alert');

      alertArea.classList.add('d-none');
      spin.classList.remove('d-none');
      btn.disabled = true;

      var res = await this.callAIEndpoint('task_summary', taskId);
      spin.classList.add('d-none');
      btn.disabled = false;

      if (res.error) {
        alertArea.className = 'alert alert-danger mb-3';
        alertArea.textContent = res.error;
        alertArea.classList.remove('d-none');
        return;
      }

      var d = res.data || {};
      var signalsHtml = (Array.isArray(d.notableSignals) && d.notableSignals.length > 0)
        ? '<ul class="mb-2 ps-3 small text-secondary">' + d.notableSignals.map(function(s) { return '<li>' + self.escapeHtml(s) + '</li>'; }).join('') + '</ul>'
        : '';
      var actionsHtml = (Array.isArray(d.suggestedTeacherActions) && d.suggestedTeacherActions.length > 0)
        ? '<ul class="mb-0 ps-3 small text-success fw-semibold">' + d.suggestedTeacherActions.map(function(a) { return '<li>' + self.escapeHtml(a) + '</li>'; }).join('') + '</ul>'
        : '';

      resultArea.innerHTML =
        '<div class="alert alert-light border mb-2">' +
          '<div class="fw-bold text-primary mb-1">' + self.escapeHtml(d.headline || 'Tóm tắt nhiệm vụ') + '</div>' +
          '<div class="small text-dark mb-2">' + self.escapeHtml(d.progressSummary || '') + '</div>' +
          (signalsHtml ? '<div class="fw-semibold small text-muted">Tín hiệu đáng chú ý:</div>' + signalsHtml : '') +
          (actionsHtml ? '<div class="fw-semibold small text-muted">Gợi ý hành động:</div>' + actionsHtml : '') +
        '</div>';
    },

    runSupportDetection: async function(container, taskId) {
      var self = this;
      var spin = container.querySelector('#support-spin');
      var btn = container.querySelector('#ai-support-btn');
      var resultArea = container.querySelector('#ai-support-result');
      var alertArea = container.querySelector('#ai-workspace-alert');

      alertArea.classList.add('d-none');
      spin.classList.remove('d-none');
      btn.disabled = true;

      var res = await this.callAIEndpoint('support_detection', taskId);
      spin.classList.add('d-none');
      btn.disabled = false;

      if (res.error) {
        alertArea.className = 'alert alert-danger mb-3';
        alertArea.textContent = res.error;
        alertArea.classList.remove('d-none');
        return;
      }

      var list = (res.data && Array.isArray(res.data.students)) ? res.data.students : [];
      if (list.length === 0) {
        resultArea.innerHTML = '<div class="alert alert-success mb-0 small"><i class="bi bi-check-circle me-1"></i>Không phát hiện học viên nào gặp khó khăn nghiêm trọng trong nhiệm vụ này.</div>';
        return;
      }

      var cardsHtml = list.map(function(item) {
        var badgeClass = item.priority === 'high' ? 'bg-danger' : (item.priority === 'medium' ? 'bg-warning text-dark' : 'bg-info text-dark');
        var priorityText = item.priority === 'high' ? 'Ưu tiên cao' : (item.priority === 'medium' ? 'Ưu tiên trung bình' : 'Khác');
        var reasons = Array.isArray(item.reasons) ? item.reasons.map(function(r) { return self.escapeHtml(r); }).join(', ') : '';

        return '<div class="card border mb-2">' +
          '<div class="card-body p-2 px-3 d-flex align-items-center justify-content-between">' +
            '<div>' +
              '<div class="fw-bold small">' + self.escapeHtml(item.studentName) + ' <span class="text-muted font-monospace">(' + self.escapeHtml(item.studentAlias) + ')</span></div>' +
              '<div class="text-muted super-small">' + self.escapeHtml(reasons) + '</div>' +
              '<div class="text-success small fw-semibold mt-1"><i class="bi bi-arrow-right-short"></i>' + self.escapeHtml(item.suggestedAction) + '</div>' +
            '</div>' +
            '<span class="badge ' + badgeClass + ' me-2">' + priorityText + '</span>' +
          '</div>' +
        '</div>';
      }).join('');

      resultArea.innerHTML = cardsHtml;
    },

    requestFeedbackSuggestion: async function(taskId, studentUid) {
      return await this.callAIEndpoint('feedback_suggestion', taskId, studentUid);
    },

    callAIEndpoint: async function(action, taskId, studentUid) {
      if (!window.BYOKManager || !window.BYOKManager.hasKey()) {
        return { error: 'Vui lòng cấu hình Gemini API Key (BYOK) trước.' };
      }

      var key = window.BYOKManager.getKey();
      if (!window.firebase || !window.firebase.auth || !window.firebase.auth().currentUser) {
        return { error: 'Phiên đăng nhập đã hết hạn.' };
      }

      try {
        var token = await window.firebase.auth().currentUser.getIdToken();
        var baseUrl = (window.JSI_API_CONFIG && window.JSI_API_CONFIG.baseUrl) ? window.JSI_API_CONFIG.baseUrl : 'http://localhost:5000';
        var endpoint = (window.JSI_API_CONFIG && window.JSI_API_CONFIG.endpoints && window.JSI_API_CONFIG.endpoints.teacherAssist) ? window.JSI_API_CONFIG.endpoints.teacherAssist : '/api/ai/teacher-assist';

        var resp = await fetch(baseUrl + endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            action: action,
            taskId: taskId,
            studentUid: studentUid || undefined,
            teacherGeminiKey: key
          })
        });

        var data = await resp.json();
        if (resp.ok && data.status === 'success') {
          return { data: data.data };
        } else {
          return { error: data.error || 'Lỗi xử lý Trợ lý AI.' };
        }
      } catch (err) {
        return { error: 'Không thể kết nối máy chủ AI: ' + err.message };
      }
    },

    escapeHtml: function(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  };

  window.AIAssistantController = AIAssistantController;
})();
