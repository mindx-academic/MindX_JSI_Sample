// B6 LAYER: Role and Profile Helper
// Xử lý đọc role và tự động tạo profile student nếu chưa có

window.ensureUserProfileAndGetRole = async (uid) => {
  const db = firebase.firestore();
  const userRef = db.collection("users").doc(uid);
  
  try {
    const docSnap = await userRef.get();
        if (docSnap.exists) {
        // Đã có profile, kiểm tra role
        const data = docSnap.data();
        if (data.role === 'student' || data.role === 'teacher') {
            return data.role;
        } else {
            throw new Error("INVALID_USER_ROLE");
        }
      } else {
        // Chưa có profile (mới đăng ký), bootstrap mặc định là student
        console.log("Bootstrap new user profile with role: student");
        await userRef.set({
          role: 'student'
        });
        return 'student';
      }
    } catch (error) {
      if (error.message === "INVALID_USER_ROLE") throw error;
      console.error("Lỗi khi kiểm tra/tạo profile:", error);
      if (window.TaskUI) {
        window.TaskUI.showOperationFeedback('error', "Không thể tải thông tin phân quyền. Vui lòng thử lại hoặc đăng xuất.");
      } else {
        console.warn("Không thể tải thông tin phân quyền. Vui lòng thử lại hoặc đăng xuất.");
      }
      throw error;
    }
};
