(function(window) {
  'use strict';

  var CommentsManager = {
    // Escape HTML to prevent XSS
    escapeHtml: function(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    // Auto-link URLs in text
    linkifyText: function(text) {
      if (!text) return '';
      var escaped = this.escapeHtml(text);
      var urlRegex = /(https?:\/\/[^\s<]+)/g;
      return escaped.replace(urlRegex, function(url) {
        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="v2-comment-link">' + url + '</a>';
      });
    },

    // Check if a comment is editable (own comment & created <= 15 minutes ago)
    isEditable: function(comment, currentUser) {
      if (!comment || !currentUser) return false;
      if (comment.authorUid !== currentUser.uid) return false; // Own edit only (Teacher cannot edit Student comment)
      
      var createdAtMs = comment.createdAtMs || (comment.createdAt ? new Date(comment.createdAt).getTime() : 0);
      if (!createdAtMs) return false;
      
      var nowMs = Date.now();
      var diffMinutes = (nowMs - createdAtMs) / (1000 * 60);
      return diffMinutes <= 15;
    },

    // Check if a comment is deletable (own comment OR user is Teacher)
    isDeletable: function(comment, currentUser) {
      if (!comment || !currentUser) return false;
      if (comment.authorUid === currentUser.uid) return true; // Own delete
      var isTeacher = currentUser.role === 'teacher' || 
                      (currentUser.email && (currentUser.email.indexOf('teacher') !== -1 || currentUser.email === 'academic@mindx.vn'));
      return isTeacher; // Teacher delete-any
    },

    // Fetch comments from Firestore (Strict Firestore Source of Truth)
    fetchComments: function(taskId, callback) {
      if (window.firebase && window.firebase.firestore) {
        var db = window.firebase.firestore();
        db.collection('tasks').doc(taskId).collection('comments')
          .get()
          .then(function(snapshot) {
            var comments = [];
            snapshot.forEach(function(doc) {
              var data = doc.data();
              data.id = doc.id;
              comments.push(data);
            });
            comments.sort(function(a, b) {
              var tA = a.createdAtMs || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
              var tB = b.createdAtMs || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
              return tA - tB;
            });
            callback(null, comments);
          })
          .catch(function(err) {
            console.error('[COMMENTS LOAD ERROR]', err.code || err.name, err.message);
            callback(new Error('Không thể tải bình luận. Vui lòng thử lại. (' + (err.code || err.message) + ')'));
          });
      } else {
        callback(new Error('Chưa khởi tạo kết nối Firestore database.'));
      }
    },

    // Add a new comment
    addComment: function(taskId, text, currentUser, callback) {
      if (!text || !text.trim()) {
        return callback(new Error('Nội dung bình luận không được để trống.'));
      }
      if (text.length > 2000) {
        return callback(new Error('Bình luận tối đa 2000 ký tự.'));
      }

      var now = new Date();
      var nowMs = Date.now();
      var commentPayload = {
        taskId: taskId,
        authorUid: currentUser.uid,
        authorName: currentUser.name || currentUser.email || 'Người dùng',
        authorRole: currentUser.role || 'student',
        authorEmail: currentUser.email || '',
        text: text.trim(),
        createdAt: now.toISOString(),
        createdAtMs: nowMs,
        updatedAt: null,
        isEdited: false
      };

      if (window.firebase && window.firebase.firestore) {
        var db = window.firebase.firestore();
        var firestorePayload = Object.assign({}, commentPayload, {
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });

        db.collection('tasks').doc(taskId).collection('comments').add(firestorePayload)
          .then(function(docRef) {
            commentPayload.id = docRef.id;
            callback(null, commentPayload);
          })
          .catch(function(err) {
            console.error('[CommentsManager] Firestore add failed:', err);
            callback(new Error('Không thể gửi bình luận. Vui lòng thử lại. (' + (err.code || err.message) + ')'));
          });
      } else {
        callback(new Error('Chưa khởi tạo kết nối Firestore database.'));
      }
    },

    // Edit an existing comment (within 15 min window, own comment only)
    updateComment: function(taskId, commentId, commentObj, newText, currentUser, callback) {
      if (!this.isEditable(commentObj, currentUser)) {
        return callback(new Error('Chỉ có thể chỉnh sửa bình luận của chính mình trong vòng 15 phút từ khi đăng.'));
      }
      if (!newText || !newText.trim()) {
        return callback(new Error('Nội dung bình luận không được để trống.'));
      }

      var now = new Date();
      var nowMs = Date.now();
      var updatePayload = {
        text: newText.trim(),
        updatedAt: now.toISOString(),
        updatedAtMs: nowMs,
        isEdited: true
      };

      if (window.firebase && window.firebase.firestore) {
        var db = window.firebase.firestore();
        var firestoreUpdate = {
          text: newText.trim(),
          updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
          isEdited: true
        };

        db.collection('tasks').doc(taskId).collection('comments').doc(commentId).update(firestoreUpdate)
          .then(function() {
            callback(null, updatePayload);
          })
          .catch(function(err) {
            console.error('[CommentsManager] Firestore update failed:', err);
            callback(new Error('Không thể cập nhật bình luận. Vui lòng thử lại. (' + (err.code || err.message) + ')'));
          });
      } else {
        callback(new Error('Chưa khởi tạo kết nối Firestore database.'));
      }
    },

    // Delete a comment (own comment or Teacher moderation)
    deleteComment: function(taskId, commentId, commentObj, currentUser, callback) {
      if (!this.isDeletable(commentObj, currentUser)) {
        return callback(new Error('Bạn không có quyền xóa bình luận này.'));
      }

      if (window.firebase && window.firebase.firestore) {
        var db = window.firebase.firestore();
        db.collection('tasks').doc(taskId).collection('comments').doc(commentId).delete()
          .then(function() {
            callback(null, true);
          })
          .catch(function(err) {
            console.error('[CommentsManager] Firestore delete failed:', err);
            callback(new Error('Không thể xóa bình luận. Vui lòng thử lại. (' + (err.code || err.message) + ')'));
          });
      } else {
        callback(new Error('Chưa khởi tạo kết nối Firestore database.'));
      }
    }
  };

  window.CommentsManager = CommentsManager;
})(window);
