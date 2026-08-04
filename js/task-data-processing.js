// B3 LAYER: Data Processing (Client-side)
// Cung cấp các hàm thuần túy sử dụng Array Methods (map, filter, find)

window.filterTasks = (tasks, keyword, status) => {
  if (!tasks) return [];
  
  return tasks.filter((task) => {
    // Check keyword
    const matchId = task.id.toLowerCase().indexOf(keyword) !== -1;
    const matchTitle = task.title.toLowerCase().indexOf(keyword) !== -1;
    const matchKeyword = matchId || matchTitle;
    
    // Check status
    const matchStatus = (status === 'all') || (task.status === status);
    
    return matchKeyword && matchStatus;
  });
};

window.findTaskById = (tasks, taskId) => {
  if (!tasks) return undefined;
  return tasks.find((task) => task.id === taskId);
};
