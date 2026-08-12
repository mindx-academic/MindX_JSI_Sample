/* JSI 2026 Optional Extensions V1 - Application Bootstrap */

(function(window) {
  'use strict';

  var Bootstrap = {
    init: async function() {
      console.log('Bootstrapping ' + (window.VersionConfig ? window.VersionConfig.NAME : 'JSI V1 Extension') + '...');

      // Subscribe to state changes via AppBridge
      if (window.AppBridge) {
        window.AppBridge.subscribeTasks(function() {
          Bootstrap.mountApp();
        });
      }

      // Auth/role resolution in app.js is authoritative. Render a visible
      // resolving state until that flow has loaded the correct task source.
      this.mountApp();
    },

    mountApp: function() {
      var container = document.getElementById('kanban-board-mount-point');
      if (!container) return;

      var state = window.AppState;
      if (!state || !state.authResolved) {
        container.innerHTML = '<div class="alert alert-light border text-secondary" role="status">Đang xác định trạng thái đăng nhập...</div>';
        return;
      }

      if (state.error) {
        container.innerHTML = '<div class="alert alert-danger" role="alert">Không thể tải dữ liệu ứng dụng. Vui lòng thử tải lại trang.</div>';
        return;
      }

      if (window.AppBridge) {
        window.AppBridge.mountKanban(container);
      }
    }
  };

  window.Bootstrap = Bootstrap;

  // Auto-init when DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    Bootstrap.init();
  });
})(window);
