const API_BASE_URL = 
  process.env.NODE_ENV === 'production' 
    ? '' // In production on Vercel, requests are relative via vercel.json rewrites
    : 'http://localhost:5000'; // In local dev, use the full URL if backend is on 5000

export default API_BASE_URL;
