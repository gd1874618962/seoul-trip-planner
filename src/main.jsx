import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initCloudSync, initRemoteSync, migrateItineraryOnce } from './data/store'
import './index.css'

Promise.all([initRemoteSync(), initCloudSync()]).finally(() => {
  migrateItineraryOnce()
  ReactDOM.createRoot(document.getElementById('root')).render(<App />)
})
