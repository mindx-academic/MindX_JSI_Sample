/* JSI 2026 Optional Extensions V1 - Firestore Operations Module (Derived) */

(function(window) {
  'use strict';

  var LEGACY_PREVIEW_PROJECT_ID = 'mindx-jsi-b6-tmp-20260804';

  function isLegacyPreviewProject() {
    return !!(window.firebase
      && window.firebase.apps
      && window.firebase.apps.length
      && window.firebase.app().options.projectId === LEGACY_PREVIEW_PROJECT_ID);
  }

  function createBackendContractError(feature) {
    var error = new Error('V1_BACKEND_CONTRACT_NOT_READY: ' + feature);
    error.code = 'v1/backend-contract-not-ready';
    return error;
  }

  var TaskFirestore = {
    /**
     * Loads tasks from Firestore or falls back to local data.
     */
    loadTasks: async function() {
      var role = window.AppState ? window.AppState.currentRole : 'public';

      // Public preview is intentionally backed by the canonical local fixture.
      if (role === 'public') {
        var localTasks = typeof window.fetchLocalTasks === 'function' ? await window.fetchLocalTasks() : [];
        return window.TaskSchemaAdapter ? window.TaskSchemaAdapter.normalizeTaskList(localTasks) : localTasks;
      }

      if (!window.db) {
        throw new Error('FIRESTORE_DB_UNAVAILABLE');
      }

      try {
        var query = window.db.collection('tasks');
        if (role === 'student') {
          query = query.where('lifecycleState', '==', 'active');
        }

        var snapshot = await query.get();
        var tasks = [];
        snapshot.forEach(function(doc) {
          var data = doc.data();
          data.id = doc.id;
          tasks.push(data);
        });



        // Apply Schema Adapter normalization
        if (window.TaskSchemaAdapter) {
          tasks = window.TaskSchemaAdapter.normalizeTaskList(tasks);
        }

        window.currentTasks = tasks;
        console.log('[V1] FIRESTORE_TASKS role=' + role + ' count=' + tasks.length);
        return tasks;
      } catch (e) {
        console.error('Firestore load error:', e);
        throw e;
      }
    },

    /**
     * Creates a new task document (Teacher only). Initial lifecycleState MUST be 'active'.
     */
    createTask: async function(taskData) {
      var normalized = window.TaskSchemaAdapter ? window.TaskSchemaAdapter.normalizeTask(taskData) : taskData;
      normalized.lifecycleState = 'active';
      normalized.archivedAt = null;
      normalized.deletedAt = null;
      normalized.purgeAfter = null;

      if (!window.db) {
        normalized.id = 'T' + String(Date.now()).slice(-3);
        if (!window.currentTasks) window.currentTasks = [];
        window.currentTasks.push(normalized);
        return normalized;
      }

      // The temporary preview project still runs the six-field Core Rules and
      // contains pre-V1 documents. Keep Core create/edit usable without
      // pretending that resources/review/lifecycle are already activated.
      if (isLegacyPreviewProject()) {
        var contractProbe = await window.db.collection('tasks').doc('T001').get();
        var usesLegacyContract = contractProbe.exists && !contractProbe.data().lifecycleState;
        if (usesLegacyContract) {
          if ((normalized.resources && normalized.resources.length) || normalized.status === 'review') {
            throw createBackendContractError('resources/review');
          }
          var legacyCreateData = {
            title: normalized.title,
            topic: normalized.topic,
            deadline: normalized.deadline,
            status: normalized.status,
            priority: normalized.priority,
            description: normalized.description
          };
          var legacyDocRef = await window.db.collection('tasks').add(legacyCreateData);
          normalized.id = legacyDocRef.id;
          return normalized;
        }
      }

      var storedData = {
        title: normalized.title,
        topic: normalized.topic,
        deadline: normalized.deadline,
        status: normalized.status,
        priority: normalized.priority,
        description: normalized.description,
        resources: normalized.resources || [],
        lifecycleState: 'active'
      };

      var docRef = await window.db.collection('tasks').add(storedData);
      normalized.id = docRef.id;
      return normalized;
    },

    /**
     * Updates an existing task document (Teacher only).
     */
    updateTask: async function(taskId, updateData) {
      if (!window.db) {
        if (window.currentTasks) {
          var idx = window.currentTasks.findIndex(function(t) { return t.id === taskId; });
          if (idx !== -1) {
            Object.assign(window.currentTasks[idx], updateData);
            return window.currentTasks[idx];
          }
        }
        return updateData;
      }

      if (isLegacyPreviewProject()) {
        var existingSnapshot = await window.db.collection('tasks').doc(taskId).get();
        var existingData = existingSnapshot.exists ? existingSnapshot.data() : null;

        if (!existingData) {
          var missingError = new Error('TASK_NOT_FOUND: ' + taskId);
          missingError.code = 'v1/task-not-found';
          throw missingError;
        }

        if (!existingData.lifecycleState) {
          if ((updateData.resources && updateData.resources.length)
            || updateData.status === 'review'
            || updateData.lifecycleState !== undefined) {
            throw createBackendContractError('resources/review/lifecycle');
          }

          var legacyPayload = {
            title: updateData.title !== undefined ? updateData.title : existingData.title,
            topic: updateData.topic !== undefined ? updateData.topic : existingData.topic,
            deadline: updateData.deadline !== undefined ? updateData.deadline : existingData.deadline,
            status: updateData.status !== undefined ? updateData.status : existingData.status,
            priority: updateData.priority !== undefined ? updateData.priority : existingData.priority,
            description: updateData.description !== undefined ? updateData.description : existingData.description
          };

          await window.db.collection('tasks').doc(taskId).update(legacyPayload);
          return legacyPayload;
        }
      }

      var payload = {};
      if (updateData.title !== undefined) payload.title = updateData.title;
      if (updateData.topic !== undefined) payload.topic = updateData.topic;
      if (updateData.deadline !== undefined) payload.deadline = updateData.deadline;
      if (updateData.status !== undefined) payload.status = updateData.status;
      if (updateData.priority !== undefined) payload.priority = updateData.priority;
      if (updateData.description !== undefined) payload.description = updateData.description;
      if (updateData.resources !== undefined) payload.resources = updateData.resources;
      if (updateData.lifecycleState !== undefined) payload.lifecycleState = updateData.lifecycleState;
      if (updateData.archivedAt !== undefined) payload.archivedAt = updateData.archivedAt;
      if (updateData.deletedAt !== undefined) payload.deletedAt = updateData.deletedAt;
      if (updateData.purgeAfter !== undefined) payload.purgeAfter = updateData.purgeAfter;

      await window.db.collection('tasks').doc(taskId).update(payload);
      return payload;
    },

    /**
     * Transition: active -> archived
     */
    archiveTask: async function(taskId) {
      var payload = {
        lifecycleState: 'archived',
        archivedAt: window.firebase ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
        deletedAt: null,
        purgeAfter: null
      };
      return this.updateTask(taskId, payload);
    },

    /**
     * Transition: archived -> active (Unarchive)
     */
    unarchiveTask: async function(taskId) {
      var payload = {
        lifecycleState: 'active',
        archivedAt: null,
        deletedAt: null,
        purgeAfter: null
      };
      return this.updateTask(taskId, payload);
    },

    /**
     * Transition: archived -> soft-deleted (30-day grace period)
     */
    softDeleteTask: async function(taskId) {
      var now = window.firebase ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
      var purgeTime = window.firebase
        ? window.firebase.firestore.Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      var payload = {
        lifecycleState: 'deleted',
        deletedAt: now,
        purgeAfter: purgeTime
      };
      return this.updateTask(taskId, payload);
    },

    /**
     * Transition: deleted -> archived (Restore before purgeAfter)
     */
    restoreTask: async function(taskId) {
      var payload = {
        lifecycleState: 'archived',
        deletedAt: null,
        purgeAfter: null
      };
      return this.updateTask(taskId, payload);
    }
  };

  window.TaskFirestore = TaskFirestore;
})(window);
