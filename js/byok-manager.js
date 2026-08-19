(function() {
  'use strict';

  var STORAGE_KEY = 'JSI_TEACHER_GEMINI_KEY';
  var AI_CACHE_PREFIX = 'JSI_AI_CACHE_';

  var BYOKManager = {
    getKey: function() {
      try {
        return window.sessionStorage.getItem(STORAGE_KEY) || null;
      } catch (e) {
        return null;
      }
    },

    setKey: function(key) {
      if (!key || typeof key !== 'string' || !key.trim()) return false;
      try {
        window.sessionStorage.setItem(STORAGE_KEY, key.trim());
        return true;
      } catch (e) {
        console.error('[BYOKManager] Failed to set sessionStorage key:', e);
        return false;
      }
    },

    clearKey: function() {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
        this.clearAICache();
      } catch (e) {}
    },

    hasKey: function() {
      return Boolean(this.getKey());
    },

    getMaskedKey: function() {
      var k = this.getKey();
      if (!k) return '';
      return '••••••••';
    },

    // Session-scoped AI Results Cache Helpers
    getAICache: function(cacheKey) {
      if (!cacheKey) return null;
      try {
        var raw = window.sessionStorage.getItem(AI_CACHE_PREFIX + cacheKey);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        return parsed ? parsed.data : null;
      } catch (e) {
        return null;
      }
    },

    setAICache: function(cacheKey, data) {
      if (!cacheKey || !data) return;
      try {
        var payload = JSON.stringify({ data: data, timestamp: Date.now() });
        window.sessionStorage.setItem(AI_CACHE_PREFIX + cacheKey, payload);
      } catch (e) {
        console.warn('[BYOKManager] Failed to cache AI result in sessionStorage:', e);
      }
    },

    clearAICache: function() {
      try {
        var keysToRemove = [];
        for (var i = 0; i < window.sessionStorage.length; i++) {
          var k = window.sessionStorage.key(i);
          if (k && k.indexOf(AI_CACHE_PREFIX) === 0) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(function(k) {
          window.sessionStorage.removeItem(k);
        });
      } catch (e) {}
    },

    validateKeyOnline: async function(keyToValidate) {
      var key = keyToValidate || this.getKey();
      if (!key) {
        return { success: false, message: 'Vui lòng nhập API key Gemini.' };
      }

      if (!window.firebase || !window.firebase.auth || !window.firebase.auth().currentUser) {
        return { success: false, message: 'Bạn chưa đăng nhập.' };
      }

      try {
        var token = await window.firebase.auth().currentUser.getIdToken();
        var baseUrl = (window.JSI_API_CONFIG && window.JSI_API_CONFIG.baseUrl) ? window.JSI_API_CONFIG.baseUrl : 'https://server-v4-preview-staging.vercel.app';
        var endpoint = (window.JSI_API_CONFIG && window.JSI_API_CONFIG.endpoints && window.JSI_API_CONFIG.endpoints.teacherAssist) ? window.JSI_API_CONFIG.endpoints.teacherAssist : '/api/ai/teacher-assist';

        var resp = await fetch(baseUrl + endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            action: 'validate_key',
            teacherGeminiKey: key
          })
        });

        var data = await resp.json();
        if (resp.ok && data.success) {
          return { success: true, message: 'Kết nối Gemini thành công.' };
        } else {
          return { success: false, message: data.error || 'API key Gemini không hợp lệ.' };
        }
      } catch (err) {
        return { success: false, message: 'Lỗi kết nối kiểm tra API key: ' + err.message };
      }
    }
  };

  // Auto clear BYOK & AI Cache on Firebase logout
  if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
    window.firebase.auth().onAuthStateChanged(function(user) {
      if (!user) {
        BYOKManager.clearKey();
      }
    });
  }

  window.BYOKManager = BYOKManager;
})();
