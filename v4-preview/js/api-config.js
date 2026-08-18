window.JSI_API_CONFIG = {
  baseUrl: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://server-v4-preview-staging.vercel.app',
  endpoints: {
    health: '/api/health',
    signUpload: '/api/cloudinary/sign-upload',
    deleteAsset: '/api/cloudinary/delete',
    teacherAssist: '/api/ai/teacher-assist'
  }
};
