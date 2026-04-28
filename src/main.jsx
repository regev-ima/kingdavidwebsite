import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initMetaPixel } from '@/lib/metaPixel'

initMetaPixel()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
