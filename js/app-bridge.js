/* JSI 2026 Optional Extensions V1 - App Bridge */

(function(window) {
  'use strict';

  var _subscribers = [];

  var AppBridge = {
    getCurrentRole: function() {
      var role = window.AppState ? window.AppState.currentRole : (window.currentRole || null);
      if (!role && window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
        var email = window.firebase.auth().currentUser.email || '';
        if (email.indexOf('teacher') !== -1 || email === 'academic@mindx.vn') {
          role = 'teacher';
        } else {
          role = 'student';
        }
      }
      return role || 'student';
    },

    getCurrentUser: function() {
      var user = window.AppState ? window.AppState.currentUser : null;
      var role = this.getCurrentRole();
      if (!user) {
        return { uid: 'anon', role: role, name: 'Khách', email: '' };
      }
      return {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || user.email || 'Người dùng',
        role: role
      };
    },

    getTasks: function() {
      var tasks = window.AppState ? window.AppState.tasks : [];
      if (window.TaskSchemaAdapter) {
        return window.TaskSchemaAdapter.normalizeTaskList(tasks);
      }
      return tasks;
    },

    getSelectedTaskId: function() {
      return window.selectedTaskId || null;
    },

    reloadTasks: async function() {
      if (window.TaskFirestore && typeof window.TaskFirestore.loadTasks === 'function') {
        var tasks = await window.TaskFirestore.loadTasks();
        var normalizedTasks = window.TaskSchemaAdapter ? window.TaskSchemaAdapter.normalizeTaskList(tasks) : tasks;
        if (window.AppState) window.AppState.tasks = normalizedTasks;
        window.currentTasks = normalizedTasks;
        this.notifySubscribers();
        return normalizedTasks;
      }
      return this.getTasks();
    },

    subscribeTasks: function(callback) {
      if (typeof callback === 'function') {
        _subscribers.push(callback);
      }
      return function unsubscribe() {
        _subscribers = _subscribers.filter(function(cb) { return cb !== callback; });
      };
    },

    notifySubscribers: function() {
      var tasks = this.getTasks();
      _subscribers.forEach(function(cb) {
        try { cb(tasks); } catch (e) { console.error('AppBridge subscriber error:', e); }
      });
    },

    openTaskDetail: function(taskId, activeTab) {
      if (window.TaskUI && typeof window.TaskUI.showTaskDetail === 'function') {
        window.TaskUI.showTaskDetail(taskId, activeTab);
      }
    },

    mountKanban: function(containerEl) {
      if (window.KanbanUI && typeof window.KanbanUI.render === 'function') {
        window.KanbanUI.render(containerEl);
      }
    },

    destroyExtension: function() {
      _subscribers = [];
      console.log('JSI V1 Extension unmounted cleanly.');
    }
  };

  window.AppBridge = AppBridge;
})(window);
