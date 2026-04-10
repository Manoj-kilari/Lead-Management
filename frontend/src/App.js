import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LeadsList from './pages/LeadsList';
import AgentsList from './pages/AgentsList';
import AddLead from './pages/AddLead';
import EditLead from './pages/EditLead';
import LeadDetail from './pages/LeadDetail';
import AgentDetail from './pages/AgentDetail';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsList />} />
            <Route path="/leads/add" element={<AddLead />} />
            <Route path="/leads/:id/edit" element={<EditLead />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/agents" element={<AgentsList />} />
            <Route path="/agents/:id" element={<AgentDetail />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </Router>
    </SocketProvider>
  );
}

export default App;
