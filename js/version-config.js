/* JSI 2026 Optional Extensions V1 - Version Configuration */

(function(window) {
  'use strict';

  window.VersionConfig = {
    VERSION: 'V1',
    NAME: 'JSI 2026 Smart Class Manager Optional Extensions V1 (Kanban & Resources)',
    BUILD: '2026.08.07-v1.0.0',
    FEATURES: {
      KANBAN: true,
      RESOURCES: true,
      COMMENTS: false,    // Deferred to V2
      PROGRESS: false,    // Deferred to V2
      SUBMISSIONS: false, // Deferred to V3
      DRAG_AND_DROP: false // Deferred to V1.1
    },
    STORAGE_LIMITS: {
      MAX_RESOURCES_PER_TASK: 20,
      MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024 // 5 MB (for V3 upload)
    }
  };
})(window);
