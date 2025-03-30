import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';  // เพิ่ม CSS ที่ต้องการที่นี่
import App from './App';  // Component หลักของแอป
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

reportWebVitals();
