import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Web3Provider } from './Web3Provider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Web3Provider poori app ko Blockchain aur Wallet ki taqat de raha hai */}
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>,
)