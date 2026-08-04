// B6 LAYER: Firestore CRUD (Create, Read, Update, Delete)
// Quản lý dữ liệu trên backend Firestore (Dùng cho Authenticated Flow)

window.fetchFirestoreTasks = async () => {
  const db = firebase.firestore();
  try {
    const snapshot = await db.collection("tasks").get(); // One-time read
    const tasks = [];
    snapshot.forEach(doc => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return tasks;
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu Firestore:", error);
    throw error;
  }
};

window.createFirestoreTask = async (taskData) => {
  const db = firebase.firestore();
  try {
    // Không thêm 'id' vào taskData
    await db.collection("tasks").add(taskData);
    // Orchestration sẽ gọi lại hàm reload UI
  } catch (error) {
    console.error("Lỗi khi tạo nhiệm vụ mới:", error);
    throw error;
  }
};

window.updateFirestoreTask = async (taskId, taskData) => {
  const db = firebase.firestore();
  try {
    await db.collection("tasks").doc(taskId).update(taskData);
  } catch (error) {
    console.error("Lỗi khi cập nhật nhiệm vụ:", error);
    throw error;
  }
};

window.deleteFirestoreTask = async (taskId) => {
  const db = firebase.firestore();
  try {
    await db.collection("tasks").doc(taskId).delete();
  } catch (error) {
    console.error("Lỗi khi xóa nhiệm vụ:", error);
    throw error;
  }
};
