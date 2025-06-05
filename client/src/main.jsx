import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ConfigProvider } from 'antd'
import uz_UZ from 'antd/locale/uz_UZ'
import 'antd/dist/reset.css'
import './index.css'
import "@fortawesome/fontawesome-free/css/all.min.css";



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider
      locale={uz_UZ}
      theme={{
        token: {
          colorPrimary: '#005BAE',
          borderRadius: 6,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
