(function(window) {
  'use strict';

  var ProgressTracker = {
    STATUS_MAP: {
      'not_started': { label: 'Chưa bắt đầu', badgeClass: 'v2-badge-gray', color: '#6c757d' },
      'in_progress': { label: 'Đang thực hiện', badgeClass: 'v2-badge-blue', color: '#0d6efd' },
      'need_help':   { label: 'Cần hỗ trợ',   badgeClass: 'v2-badge-warning', color: '#ffc107' },
      'completed':   { label: 'Hoàn thành',   badgeClass: 'v2-badge-success', color: '#198754' }
    },

    // Fetch personal progress for a specific student on a task
    getStudentProgress: function(taskId, studentUid, callback) {
      if (!taskId || !studentUid) {
        return callback(null, { status: 'not_started', updatedAt: null });
      }

      if (window.firebase && window.firebase.firestore) {
        var db = window.firebase.firestore();
        db.collection('tasks').doc(taskId).collection('progress').doc(studentUid).get()
          .then(function(doc) {
            if (doc.exists) {
              callback(null, doc.data());
            } else {
              callback(null, { status: 'not_started', updatedAt: null });
            }
          })
          .catch(function(err) {
            console.warn('[ProgressTracker] Firestore get progress failed, using local cache:', err);
            var localKey = 'jsi_prog_' + taskId + '_' + studentUid;
            var localData = JSON.parse(localStorage.getItem(localKey) || '{"status":"not_started"}');
            callback(null, localData);
          });
      } else {
        var localKey = 'jsi_prog_' + taskId + '_' + studentUid;
        var localData = JSON.parse(localStorage.getItem(localKey) || '{"status":"not_started"}');
        callback(null, localData);
      }
    },

    // Update personal progress (Student only)
    setStudentProgress: function(taskId, studentUid, newStatus, currentUser, callback) {
      if (!taskId || !studentUid) {
        return callback(new Error('Thiếu taskId hoặc studentUid.'));
      }
      if (currentUser.role === 'teacher' || currentUser.email === 'teacher@mindx.edu.vn') {
        return callback(new Error('Giáo viên chỉ có quyền xem tiến độ, không được ghi thay Học viên.'));
      }
      if (currentUser.uid !== studentUid) {
        return callback(new Error('Học viên chỉ có quyền cập nhật tiến độ của chính mình.'));
      }
      if (!this.STATUS_MAP[newStatus]) {
        return callback(new Error('Trạng thái tiến độ không hợp lệ.'));
      }

      var now = new Date();
      var payload = {
        studentUid: studentUid,
        studentName: currentUser.name || currentUser.email || 'Học viên',
        studentEmail: currentUser.email || '',
        status: newStatus,
        updatedAt: now.toISOString(),
        updatedAtMs: Date.now()
      };

      if (window.firebase && window.firebase.firestore) {
        var db = window.firebase.firestore();
        db.collection('tasks').doc(taskId).collection('progress').doc(studentUid).set(payload)
          .then(function() {
            callback(null, payload);
          })
          .catch(function(err) {
            console.warn('[ProgressTracker] Firestore set progress failed, using local cache:', err);
            var localKey = 'jsi_prog_' + taskId + '_' + studentUid;
            localStorage.setItem(localKey, JSON.stringify(payload));
            callback(null, payload);
          });
      } else {
        var localKey = 'jsi_prog_' + taskId + '_' + studentUid;
        localStorage.setItem(localKey, JSON.stringify(payload));
        callback(null, payload);
      }
    },

    // Fetch progress of ALL students for a task (Teacher Overview)
    getClassOverview: function(taskId, callback) {
      if (window.firebase && window.firebase.firestore) {
        var db = window.firebase.firestore();
        db.collection('tasks').doc(taskId).collection('progress').get()
          .then(function(snapshot) {
            var records = [];
            snapshot.forEach(function(doc) {
              records.push(doc.data());
            });
            callback(null, records);
          })
          .catch(function(err) {
            console.warn('[ProgressTracker] Firestore get class overview failed:', err);
            callback(null, []);
          });
      } else {
        callback(null, []);
      }
    }
  };

  window.ProgressTracker = ProgressTracker;
})(window);
