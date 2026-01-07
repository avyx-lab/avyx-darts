import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@avyx/core'
// @ts-ignore
import '@avyx/core/styles'
import './pages.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </React.StrictMode>,
)
