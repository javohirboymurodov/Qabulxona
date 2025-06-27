import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App } from 'antd'
import uz_UZ from 'antd/locale/uz_UZ'
import AppComponent from './App.jsx'
import 'antd/dist/reset.css'
import './index.css'
import "@fortawesome/fontawesome-free/css/all.min.css"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={uz_UZ}
        theme={{
          token: {
            colorPrimary: '#005BAE',
            borderRadius: 6,
          },
        }}
      >
        <App>
          <AppComponent />
        </App>
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
