/* JSI 2026 Optional Extensions V1 - Resource URL Detector */

(function(window) {
  'use strict';

  var ResourceDetector = {
    /**
     * Auto-detects resource type from URL string
     */
    detectType: function(url) {
      if (!url || typeof url !== 'string') return 'other';
      var lower = url.trim().toLowerCase();

      if (lower.indexOf('docs.google.com/document') !== -1) return 'google-docs';
      if (lower.indexOf('docs.google.com/presentation') !== -1) return 'google-slides';
      if (lower.indexOf('docs.google.com/spreadsheets') !== -1) return 'google-sheets';
      if (lower.indexOf('drive.google.com') !== -1) return 'google-drive';
      if (lower.indexOf('figma.com') !== -1) return 'figma';
      if (lower.indexOf('github.com') !== -1 || lower.indexOf('gist.github.com') !== -1) return 'github';
      if (lower.indexOf('youtube.com') !== -1 || lower.indexOf('youtu.be') !== -1 || lower.indexOf('vimeo.com') !== -1) return 'video';
      
      // Image extension check
      if (/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(lower)) return 'image';

      if (lower.indexOf('http://') === 0 || lower.indexOf('https://') === 0) return 'website';

      return 'other';
    },

    /**
     * Extracts display domain from URL
     */
    extractDomain: function(url) {
      try {
        var parsed = new URL(url);
        return parsed.hostname.replace(/^www\./, '');
      } catch (e) {
        return 'external-link';
      }
    },

    /**
     * Returns type metadata (label, icon class, theme color)
     */
    getTypeMeta: function(type) {
      var metaMap = {
        'google-docs': { label: 'Google Docs', iconClass: 'google-docs', symbol: '📄' },
        'google-slides': { label: 'Google Slides', iconClass: 'google-slides', symbol: '📊' },
        'google-sheets': { label: 'Google Sheets', iconClass: 'google-sheets', symbol: '📈' },
        'google-drive': { label: 'Google Drive', iconClass: 'google-drive', symbol: '📁' },
        'figma': { label: 'Figma', iconClass: 'figma', symbol: '🎨' },
        'github': { label: 'GitHub', iconClass: 'github', symbol: '💻' },
        'image': { label: 'Hình ảnh', iconClass: 'image', symbol: '🖼️' },
        'video': { label: 'Video', iconClass: 'video', symbol: '🎥' },
        'website': { label: 'Trang web', iconClass: 'website', symbol: '🌐' },
        'other': { label: 'Tài liệu khác', iconClass: 'other', symbol: '🔗' }
      };

      return metaMap[type] || metaMap['other'];
    }
  };

  window.ResourceDetector = ResourceDetector;
})(window);
