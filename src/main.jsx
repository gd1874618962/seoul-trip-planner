import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initRemoteSync } from './data/store'
import './index.css'

initRemoteSync().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />)
})
