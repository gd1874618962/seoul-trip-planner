import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initCloudSync, initRemoteSync } from './data/store'
import './index.css'

Promise.all([initRemoteSync(), initCloudSync()]).finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />)
})
