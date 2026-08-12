window.JSI_API_CONFIG = {
  baseUrl: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://server-nu-gilt-20.vercel.app',
  endpoints: {
    health: '/api/health',
    signUpload: '/api/cloudinary/sign-upload',
    deleteAsset: '/api/cloudinary/delete'
  }
};
