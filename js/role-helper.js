// B6 LAYER: Role and Profile Helper
// Xử lý đọc role và tự động tạo profile student nếu chưa có

window.ensureUserProfileAndGetRole = async (uid) => {
  const db = firebase.firestore();
  const userRef = db.collection("users").doc(uid);
  
  try {
    const docSnap = await userRef.get();
    
    if (docSnap.exists) {
      // Đã có profile, trả về role
      const data = docSnap.data();
      return data.role || 'student';
    } else {
      // Chưa có profile (mới đăng ký), bootstrap mặc định là student
      console.log("Bootstrap new user profile with role: student");
      await userRef.set({
        role: 'student'
      });
      return 'student';
    }
  } catch (error) {
    console.error("Lỗi khi kiểm tra/tạo profile:", error);
    // Fallback an toàn nhất
    return 'student'; 
  }
};
