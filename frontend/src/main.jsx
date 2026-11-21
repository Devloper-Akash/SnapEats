import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, { serverUrl } from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'
import axios from 'axios'

axios.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    const isBackend =
      url.startsWith(serverUrl) ||
      url.startsWith("/api") ||
      (!url.startsWith("http://") && !url.startsWith("https://"));

    if (isBackend) {
      config.withCredentials = true;
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      config.withCredentials = false;
      if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>,
)
