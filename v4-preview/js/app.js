/* JSI 2026 Optional Extensions V1 - App Orchestrator (Derived) */

(function(window) {
  'use strict';

  // One authoritative state store. Legacy globals are mirrored only for
  // compatibility with the derived V1 modules; renderers read AppState.
  window.AppState = {
    currentUser: null,
    currentRole: null,
    tasks: [],
    authResolved: false,
    error: null
  };
  window.currentTasks = [];
  window.currentRole = null;
  window.selectedTaskId = window.selectedTaskId || null;

  var App = {
    init: async function() {
      console.log('App Orchestrator Starting (V1 Derived Release)...');
      
      this.bindLogoutControls();
      this.bindNavigationControls();
      this.updateNavShell();
      if (window.Bootstrap) window.Bootstrap.mountApp();

      // Authoritative runtime flow: Auth -> profile role -> tasks -> render.
      if (window.firebase && window.firebase.auth) {
        window.firebase.auth().onAuthStateChanged(async function(user) {
          var state = window.AppState;
          state.authResolved = false;
          state.error = null;
          state.currentUser = user || null;
          state.currentRole = null;
          state.tasks = [];
          window.currentRole = null;
          window.currentTasks = [];
          App.updateNavShell();
          if (window.Bootstrap) window.Bootstrap.mountApp();

          console.log('[V1] AUTH_STATE ' + (user ? ('uid=' + user.uid + ' email=' + user.email) : 'signed-out'));

          try {
            var role = 'public';
            if (user) {
            if (typeof window.ensureUserProfileAndGetRole === 'function') {
                role = await window.ensureUserProfileAndGetRole(user.uid);
            } else if (window.RoleHelper && typeof window.RoleHelper.fetchUserRole === 'function') {
                role = await window.RoleHelper.fetchUserRole(user.uid);
            } else {
                throw new Error('ROLE_RESOLVER_UNAVAILABLE');
              }
            }

            state.currentRole = role;
            window.currentRole = role;
            console.log('[V1] PROFILE_ROLE', role);

            var tasks = window.AppBridge ? await window.AppBridge.reloadTasks() : [];
            state.tasks = tasks;
            window.currentTasks = tasks;
            state.authResolved = true;
            console.log('[V1] TASK_COUNT', tasks.length);
            console.log('[V1] RENDER_BRANCH', role);
          } catch (error) {
            state.error = error;
            state.authResolved = true;
            console.error('[V1] APP_STATE_ERROR', error);
          }

          App.updateNavShell();
          if (window.Bootstrap) window.Bootstrap.mountApp();
        });
      } else {
        window.AppState.error = new Error('FIREBASE_AUTH_UNAVAILABLE');
        window.AppState.authResolved = true;
        console.error('[V1] APP_STATE_ERROR Firebase Auth unavailable');
        if (window.Bootstrap) window.Bootstrap.mountApp();
      }
    },

    bindLogoutControls: function() {
      ['logout-btn-teacher', 'logout-btn-student'].forEach(function(id) {
        var button = document.getElementById(id);
        if (!button || button.dataset.logoutBound === 'true') return;
        button.dataset.logoutBound = 'true';
        button.addEventListener('click', function(event) {
          event.preventDefault();
          if (typeof window.logoutUser === 'function') window.logoutUser();
        });
      });
    },

    bindNavigationControls: function() {
      var tasksLink = document.getElementById('tasks-nav-link-teacher');
      var archiveLink = document.getElementById('archive-nav-link-teacher');

      if (tasksLink && tasksLink.dataset.navigationBound !== 'true') {
        tasksLink.dataset.navigationBound = 'true';
        tasksLink.addEventListener('click', function(event) {
          event.preventDefault();
          var board = document.getElementById('kanban-board-mount-point');
          if (board) board.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }

      if (archiveLink && archiveLink.dataset.navigationBound !== 'true') {
        archiveLink.dataset.navigationBound = 'true';
        archiveLink.addEventListener('click', function(event) {
          event.preventDefault();
          var archive = document.querySelector('.archived-section-container');
          if (!archive) {
            if (window.TaskUI) window.TaskUI.showOperationFeedback('error', 'Không tìm thấy khu vực lưu trữ.');
            return;
          }
          archive.classList.add('open');
          var icon = archive.querySelector('.toggle-icon');
          if (icon) {
            icon.classList.remove('bi-chevron-down');
            icon.classList.add('bi-chevron-up');
          }
          archive.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    },

    updateNavShell: function() {
      var role = window.AppState ? window.AppState.currentRole : null;
      var teacherNav = document.getElementById('teacher-nav-links');
      var studentNav = document.getElementById('student-nav-links');
      var publicNav = document.getElementById('public-nav-links');

      if (teacherNav) teacherNav.style.display = (role === 'teacher') ? 'flex' : 'none';
      if (studentNav) studentNav.style.display = (role === 'student') ? 'flex' : 'none';
      if (publicNav) publicNav.style.display = (role === 'public') ? 'flex' : 'none';
    }
  };

  window.App = App;

  document.addEventListener('DOMContentLoaded', function() {
    App.init();
  });
})(window);
