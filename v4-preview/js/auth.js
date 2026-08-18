// B5 LAYER: Authentication
// Xử lý Register, Login, Logout và quan sát trạng thái đăng nhập

window.isFirebaseConfigured = () => {
  return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
};

window.registerUser = (email, password, errorElementId) => {
    if (window.TaskUI) {
      window.TaskUI.showOperationFeedback('error', "Vui lòng cấu hình Firebase trước khi sử dụng tính năng này.");
    } else {
      console.warn("Vui lòng cấu hình Firebase trước khi sử dụng tính năng này.");
    }
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Đăng ký thành công, Firebase Auth tự động sign in và kích hoạt onAuthStateChanged.
      // Quá trình tạo profile (users/{uid}) sẽ được xử lý ở onAuthStateChanged (role-helper.js).
      window.location.href = "index.html?v=20260811-runtime3";
    })
    .catch((error) => {
      const errorMsg = document.getElementById(errorElementId);
      if (errorMsg) {
        errorMsg.innerText = `Lỗi đăng ký: ${error.message}`;
        errorMsg.classList.remove('hidden');
      }
      console.error("Register Error:", error);
    });
};

window.loginUser = (email, password, errorElementId) => {
    if (window.TaskUI) {
      window.TaskUI.showOperationFeedback('error', "Vui lòng cấu hình Firebase trước khi sử dụng tính năng này.");
    } else {
      console.warn("Vui lòng cấu hình Firebase trước khi sử dụng tính năng này.");
    }
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Đăng nhập thành công, chuyển hướng về trang chủ.
      window.location.href = "index.html?v=20260811-runtime3";
    })
    .catch((error) => {
      const errorMsg = document.getElementById(errorElementId);
      if (errorMsg) {
        errorMsg.innerText = `Lỗi đăng nhập: Sai email hoặc mật khẩu.`;
        errorMsg.classList.remove('hidden');
      }
      console.error("Login Error:", error);
    });
};

window.logoutUser = () => {
  if (!window.isFirebaseConfigured()) return;
  firebase.auth().signOut()
    .then(() => {
      console.log("Đăng xuất thành công");
      // Orchestration app.js sẽ bắt event onAuthStateChanged(null) và dọn dẹp view
    })
    .catch((error) => {
      console.error("Logout Error:", error);
    });
};

// Đăng ký listener auth state toàn cục, giao tiếp với app.js
if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.apps !== 'undefined' && firebase.apps.length > 0) {
  firebase.auth().onAuthStateChanged((user) => {
    // Kích hoạt callback nếu app.js đã đăng ký
    if (window.onAuthChangedCallback) {
      window.onAuthChangedCallback(user);
    }
  });
} else {
  // Báo cho app.js biết nếu Firebase chưa cấu hình
  window.addEventListener('DOMContentLoaded', () => {
    if (window.firebaseConfigMissing && document.getElementById('public-view')) {
      const banner = document.createElement('div');
      banner.style.backgroundColor = '#ffcccc';
      banner.style.color = 'red';
      banner.style.padding = '10px';
      banner.style.textAlign = 'center';
      banner.innerText = 'Cảnh báo: Chưa cấu hình Firebase. Các chức năng đăng nhập, đăng ký và Teacher View sẽ bị vô hiệu hóa.';
      document.body.prepend(banner);
    }
  });
}
