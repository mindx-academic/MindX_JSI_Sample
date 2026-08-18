/* JSI 2026 Optional Extensions V1 - Task Schema Adapter */

(function(window) {
  'use strict';

  var DEFAULT_TITLES = {
    'T001': 'Ôn tập DOM và Event',
    'T002': 'Ôn tập HTML và CSS',
    'T003': 'Hoàn thành giao diện mini project',
    'T004': 'Chuẩn bị slide giới thiệu dự án',
    'T005': 'Kiểm tra bố cục website',
    'T006': 'Quay video demo sản phẩm',
    'T007': 'Chỉnh sửa dự án theo nhận xét',
    'T008': 'Nộp bản kế hoạch sản phẩm'
  };

  var TaskSchemaAdapter = {
    /**
     * Normalizes a raw Firestore or local task document into a valid V1 task contract.
     * Ensures:
     * - resources array is initialized (missing -> [])
     * - lifecycleState is initialized (missing -> 'active')
     * - status is valid ('todo', 'doing', 'review', 'done')
     */
    normalizeTask: function(rawTask) {
      if (!rawTask || typeof rawTask !== 'object') {
        return null;
      }

      var normalized = Object.assign({}, rawTask);

      // Core 6 fields preservation with default title mapping fallback
      var defaultTitle = (normalized.id && DEFAULT_TITLES[normalized.id]) ? DEFAULT_TITLES[normalized.id] : 'Nhiệm vụ chưa có tiêu đề';
      if (!normalized.title || normalized.title === 'Nhiệm vụ chưa có tiêu đề') {
        normalized.title = defaultTitle;
      }

      normalized.topic = normalized.topic || 'Chưa phân loại';
      normalized.deadline = normalized.deadline || new Date().toISOString().split('T')[0];
      
      // Workflow status validation
      var validStatuses = ['todo', 'doing', 'review', 'done'];
      if (validStatuses.indexOf(normalized.status) === -1) {
        normalized.status = 'todo';
      }

      // Priority validation
      var validPriorities = ['low', 'medium', 'high'];
      if (validPriorities.indexOf(normalized.priority) === -1) {
        normalized.priority = 'medium';
      }

      normalized.description = normalized.description || '';

      // V1 Extension Field Normalization
      if (!Array.isArray(normalized.resources)) {
        normalized.resources = [];
      } else {
        normalized.resources = normalized.resources.map(function(res, idx) {
          return {
            resourceId: res.resourceId || ('res_' + Date.now() + '_' + idx),
            title: res.title || 'Tài liệu không tên',
            url: res.url || '#',
            resourceType: res.resourceType || 'other',
            description: res.description || '',
            thumbnailUrl: res.thumbnailUrl || null,
            order: typeof res.order === 'number' ? res.order : idx,
            createdAt: res.createdAt || new Date().toISOString(),
            createdBy: res.createdBy || 'teacher'
          };
        });
      }

      // Separate Lifecycle Normalization
      var validLifecycles = ['active', 'archived', 'deleted'];
      if (!normalized.lifecycleState || validLifecycles.indexOf(normalized.lifecycleState) === -1) {
        normalized.lifecycleState = 'active';
      }

      normalized.archivedAt = normalized.archivedAt || null;
      normalized.deletedAt = normalized.deletedAt || null;
      normalized.purgeAfter = normalized.purgeAfter || null;

      return normalized;
    },

    /**
     * Normalizes an array of raw tasks.
     */
    normalizeTaskList: function(rawTasks) {
      if (!Array.isArray(rawTasks)) return [];
      var self = this;
      return rawTasks.map(function(t) {
        return self.normalizeTask(t);
      }).filter(Boolean);
    }
  };

  window.TaskSchemaAdapter = TaskSchemaAdapter;
})(window);
