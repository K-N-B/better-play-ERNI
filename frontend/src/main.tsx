// What it is: The entry point for your entire application.

// What you need to do:
// Initialize your MSAL PublicClientApplication instance here.
// Wrap your <App /> component in the <MsalProvider instance={msalInstance}>.
// Render the app to the DOM.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './assets/styles/index.css';
import 'flowbite';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
