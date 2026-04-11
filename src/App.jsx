import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DisplayPage from './pages/DisplayPage';
import OperatorPage from './pages/OperatorPage';
import TicketPage from './pages/TicketPage';
import AdminPage from './pages/AdminPage';
import SetupPage from './pages/SetupPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/display" element={<DisplayPage />} />
      <Route path="/dashboard" element={<OperatorPage />} />
      <Route path="/ticket" element={<TicketPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/setup" element={<SetupPage />} />
    </Routes>
  );
}
