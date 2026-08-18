(function() {
  'use strict';

  var STORAGE_KEY = 'JSI_TEACHER_GEMINI_KEY';

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
        var baseUrl = (window.JSI_API_CONFIG && window.JSI_API_CONFIG.baseUrl) ? window.JSI_API_CONFIG.baseUrl : 'http://localhost:5000';
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

  // Auto clear BYOK on Firebase logout
  if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
    window.firebase.auth().onAuthStateChanged(function(user) {
      if (!user) {
        BYOKManager.clearKey();
      }
    });
  }

  window.BYOKManager = BYOKManager;
})();
