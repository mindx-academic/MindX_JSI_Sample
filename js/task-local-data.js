// B2 LAYER: Local Data Fetching
// Chuyên tải dữ liệu từ tasks.json cục bộ (chỉ dùng cho Public Flow)

window.fetchLocalTasks = async () => {
  try {
    const response = await fetch('data/tasks.json');
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi tải Local JSON:", error);
    throw error;
  }
};
