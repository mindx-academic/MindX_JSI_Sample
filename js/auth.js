// B5 LAYER: Authentication
// Xử lý Register, Login, Logout và quan sát trạng thái đăng nhập

window.registerUser = (email, password, errorElementId) => {
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Đăng ký thành công, Firebase Auth tự động sign in và kích hoạt onAuthStateChanged.
      // Quá trình tạo profile (users/{uid}) sẽ được xử lý ở onAuthStateChanged (role-helper.js).
      window.location.href = "index.html";
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
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Đăng nhập thành công, chuyển hướng về trang chủ.
      window.location.href = "index.html";
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
if (typeof firebase !== 'undefined' && firebase.auth) {
  firebase.auth().onAuthStateChanged((user) => {
    // Kích hoạt callback nếu app.js đã đăng ký
    if (window.onAuthChangedCallback) {
      window.onAuthChangedCallback(user);
    }
  });
}
