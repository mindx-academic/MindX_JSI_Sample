(function(window) {
  'use strict';
  
  var apiConfig = window.JSI_API_CONFIG || { baseUrl: 'http://localhost:5000' };

  var SubmissionManager = {
    SERVER_BASE_URL: apiConfig.baseUrl,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/zip', 'application/x-zip-compressed'],
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES_PER_SUBMISSION: 3,

    STATUS_MAP: {
      'not_submitted': { label: 'Chưa nộp', badgeClass: 'bg-secondary' },
      'draft':         { label: 'Bản nháp', badgeClass: 'bg-warning text-dark' },
      'submitted':     { label: 'Đã nộp', badgeClass: 'bg-primary' },
      'needs_revision':{ label: 'Cần sửa đổi', badgeClass: 'bg-danger' },
      'completed':     { label: 'Đã hoàn thành', badgeClass: 'bg-success' }
    },

    // Helper: Get Current Firebase ID Token strictly
    getIdToken: function(callback) {
      if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
        window.firebase.auth().currentUser.getIdToken(true)
          .then(function(token) { callback(null, token); })
          .catch(function(err) { callback(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')); });
      } else {
        callback(new Error('Người dùng chưa đăng nhập hệ thống. Vui lòng đăng nhập lại.'));
      }
    },

    // Upload file directly to Cloudinary using Node.js Express backend signed parameters
    uploadFileToCloudinary: function(file, studentUid, taskId, existingCount, callback) {
      var self = this;
      if (!file) return callback(new Error('Tệp không tồn tại.'));
      if (file.size > self.MAX_FILE_SIZE) return callback(new Error('Tệp vượt quá giới hạn 5 MB.'));
      if (self.ALLOWED_TYPES.indexOf(file.type) === -1) return callback(new Error('Định dạng tệp không được hỗ trợ.'));
      if (existingCount >= self.MAX_FILES_PER_SUBMISSION) return callback(new Error('Mỗi bài nộp chỉ được đính kèm tối đa 3 tệp.'));

      self.getIdToken(function(errToken, idToken) {
        if (errToken) return callback(errToken);

        // 1. Get signed params from Node.js Express server
        fetch(self.SERVER_BASE_URL + '/api/cloudinary/sign-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + idToken
          },
          body: JSON.stringify({
            taskId: taskId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            existingCount: existingCount
          })
        })
        .then(function(res) {
          if (!res.ok) {
            return res.json().then(function(data) {
              console.error('[CLOUDINARY SIGN ERROR]', res.status, data.error);
              throw new Error(data.error || 'Không thể lấy chữ ký tải lên.');
            });
          }
          return res.json();
        })
        .then(function(signResult) {
          if (!signResult.signedParams) throw new Error('Dữ liệu chữ ký từ máy chủ không hợp lệ.');
          var sp = signResult.signedParams;

          // 2. Direct POST FormData file upload to Cloudinary
          var formData = new FormData();
          formData.append('file', file);
          formData.append('api_key', sp.api_key);
          formData.append('timestamp', sp.timestamp);
          formData.append('folder', sp.folder);
          formData.append('public_id', sp.public_id);
          formData.append('signature', sp.signature);

          var uploadUrl = 'https://api.cloudinary.com/v1_1/' + sp.cloud_name + '/auto/upload';

          return fetch(uploadUrl, { method: 'POST', body: formData })
            .then(function(uploadRes) {
              if (!uploadRes.ok) {
                return uploadRes.json().then(function(errData) {
                  var cloudErr = (errData && errData.error && errData.error.message) ? errData.error.message : ('HTTP ' + uploadRes.status);
                  console.error('[CLOUDINARY UPLOAD ERROR]', uploadRes.status, cloudErr);
                  throw new Error('Không thể tải tệp lên Cloudinary: ' + cloudErr);
                });
              }
              return uploadRes.json();
            })
            .then(function(cRes) {
              var fileMeta = {
                fileId: sp.file_id,
                assetId: cRes.asset_id || cRes.public_id,
                publicId: cRes.public_id,
                resourceType: cRes.resource_type || 'auto',
                deliveryType: cRes.type || 'upload',
                format: cRes.format || file.name.split('.').pop(),
                bytes: cRes.bytes || file.size,
                originalFilename: file.name,
                secureUrl: cRes.secure_url || cRes.url,
                uploadedAt: new Date().toISOString()
              };
              callback(null, fileMeta);
            });
        })
        .catch(function(err) {
          console.warn('[SubmissionManager] Cloudinary upload error:', err);
          callback(new Error(err.message || 'Không thể tải tệp lên. Vui lòng thử lại.'));
        });
      });
    },

    // Delete asset from Cloudinary via Node.js Express backend
    deleteCloudinaryAsset: function(publicId, studentUid, taskId, callback) {
      var self = this;
      self.getIdToken(function(errToken, idToken) {
        if (errToken) return callback(errToken);

        fetch(self.SERVER_BASE_URL + '/api/cloudinary/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + idToken
          },
          body: JSON.stringify({ publicId: publicId, taskId: taskId })
        })
        .then(function(res) {
          if (!res.ok) {
            return res.json().then(function(data) { throw new Error(data.error || 'Không thể xóa tệp. Vui lòng thử lại.'); });
          }
          return res.json();
        })
        .then(function(data) {
          callback(null, data);
        })
        .catch(function(err) {
          console.warn('[SubmissionManager] Cloudinary delete error:', err);
          callback(new Error(err.message || 'Không thể xóa tệp. Vui lòng thử lại.'));
        });
      });
    },

    // Get submission for student on a task
    getSubmission: function(taskId, studentUid, callback) {
      if (!taskId || !studentUid) return callback(null, null);

      if (window.firebase && window.firebase.firestore) {
        var db = window.firebase.firestore();
        db.collection('tasks').doc(taskId).collection('submissions').doc(studentUid).get()
          .then(function(doc) {
            if (doc.exists) callback(null, doc.data()); else callback(null, null);
          })
          .catch(function(err) {
            console.warn('[SubmissionManager] Firestore read failed, checking local storage:', err);
            var localKey = 'jsi_sub_' + taskId + '_' + studentUid;
            var localData = JSON.parse(localStorage.getItem(localKey) || 'null');
            callback(null, localData);
          });
      } else {
        var localKey = 'jsi_sub_' + taskId + '_' + studentUid;
        callback(null, JSON.parse(localStorage.getItem(localKey) || 'null'));
      }
    },

    // Save Student Submission (Draft or Final Submit)
    saveStudentSubmission: function(taskId, currentUser, isFinal, links, notes, filesMeta, callback) {
      if (!taskId || !currentUser || currentUser.role === 'teacher') {
        return callback(new Error('Chỉ có học viên mới được nộp bài.'));
      }

      var now = new Date();
      var targetStatus = isFinal ? 'submitted' : 'draft';

      var payload = {
        studentUid: currentUser.uid,
        studentName: currentUser.name || currentUser.email || 'Học viên',
        studentEmail: currentUser.email || '',
        taskId: taskId,
        status: targetStatus,
        links: links || [],
        notes: notes || '',
        files: filesMeta || [],
        updatedAt: now.toISOString(),
        updatedAtMs: Date.now()
      };

      if (window.firebase && window.firebase.firestore) {
        var db = window.firebase.firestore();
        db.collection('tasks').doc(taskId).collection('submissions').doc(currentUser.uid).set(payload, { merge: true })
          .then(function() { callback(null, payload); })
          .catch(function(err) {
            console.warn('[SubmissionManager] Firestore save failed, using local cache:', err);
            var localKey = 'jsi_sub_' + taskId + '_' + currentUser.uid;
            localStorage.setItem(localKey, JSON.stringify(payload));
            callback(null, payload);
          });
      } else {
        var localKey = 'jsi_sub_' + taskId + '_' + currentUser.uid;
        localStorage.setItem(localKey, JSON.stringify(payload));
        callback(null, payload);
      }
    },

    // Save Teacher Feedback & Update Status (needs_revision or completed)
    saveTeacherFeedback: function(taskId, studentUid, newStatus, feedbackText, currentUser, callback) {
      if (!currentUser || (currentUser.role !== 'teacher' && currentUser.email !== 'teacher@mindx.edu.vn' && currentUser.email !== 'academic@mindx.vn')) {
        return callback(new Error('Chỉ có giáo viên mới có quyền chấm bài và gửi phản hồi.'));
      }
      if (['needs_revision', 'completed'].indexOf(newStatus) === -1) {
        return callback(new Error('Trạng thái đánh giá không hợp lệ.'));
      }

      var now = new Date();
      var updatePayload = {
        status: newStatus,
        teacherFeedback: feedbackText || '',
        feedbackAt: now.toISOString(),
        feedbackAtMs: Date.now()
      };

      if (window.firebase && window.firebase.firestore) {
        var db = window.firebase.firestore();
        db.collection('tasks').doc(taskId).collection('submissions').doc(studentUid).update(updatePayload)
          .then(function() { callback(null, updatePayload); })
          .catch(function(err) {
            console.warn('[SubmissionManager] Firestore update feedback failed, using local cache:', err);
            var localKey = 'jsi_sub_' + taskId + '_' + studentUid;
            var localData = JSON.parse(localStorage.getItem(localKey) || '{}');
            Object.assign(localData, updatePayload);
            localStorage.setItem(localKey, JSON.stringify(localData));
            callback(null, updatePayload);
          });
      } else {
        var localKey = 'jsi_sub_' + taskId + '_' + studentUid;
        var localData = JSON.parse(localStorage.getItem(localKey) || '{}');
        Object.assign(localData, updatePayload);
        localStorage.setItem(localKey, JSON.stringify(localData));
        callback(null, updatePayload);
      }
    },

    // Fetch all submissions for Teacher Review
    getClassSubmissions: function(taskId, callback) {
      if (window.firebase && window.firebase.firestore) {
        var db = window.firebase.firestore();
        db.collection('tasks').doc(taskId).collection('submissions').get()
          .then(function(snapshot) {
            var records = [];
            snapshot.forEach(function(doc) { records.push(doc.data()); });
            callback(null, records);
          })
          .catch(function(err) {
            console.error('[SUBMISSIONS LOAD ERROR]', err.code || err.name, err.message);
            var records = [];
            for (var i = 0; i < localStorage.length; i++) {
              var key = localStorage.key(i);
              if (key && key.indexOf('jsi_sub_' + taskId + '_') === 0) {
                try {
                  var item = JSON.parse(localStorage.getItem(key));
                  if (item && item.status) records.push(item);
                } catch (e) {}
              }
            }
            if (records.length > 0) {
              callback(null, records);
            } else {
              callback(new Error('Không thể tải danh sách bài nộp. Vui lòng thử lại. (' + (err.code || 'PERM_DENIED') + ')'));
            }
          });
      } else {
        var records = [];
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && key.indexOf('jsi_sub_' + taskId + '_') === 0) {
            try {
              var item = JSON.parse(localStorage.getItem(key));
              if (item && item.status) records.push(item);
            } catch (e) {}
          }
        }
        callback(null, records);
      }
    }
  };

  window.SubmissionManager = SubmissionManager;
})(window);
