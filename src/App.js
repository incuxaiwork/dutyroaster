import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Officers from './pages/Officers';
import DutyTypes from './pages/DutyTypes';
import Configuration from './pages/Configuration';
import Generate from './pages/Generate';
import RosterView from './pages/RosterView';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111827',
              color: '#e2e8f0',
              border: '1px solid rgba(99,179,237,0.2)',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '13px',
            },
          }}
        />
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/officers" element={<Officers />} />
            <Route path="/duties" element={<DutyTypes />} />
            <Route path="/config" element={<Configuration />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/roster" element={<RosterView />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}