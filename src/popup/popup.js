import React from 'react';
import ReactDOM from 'react-dom/client';
import PopupApp from './components/PopupApp.js';
import './popup.scss';

const root = ReactDOM.createRoot(document.getElementById('popup-root'));
root.render(<PopupApp />);