import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Bot, List, Settings, Activity } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import ListsPage from './pages/ListsPage';
import ListDetailsPage from './pages/ListDetailsPage';
import SettingsPage from './pages/SettingsPage';
import LogsPage from './pages/LogsPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Sidebar */}
        <div className="sidebar">
          <h1>HolidayBOT</h1>
          <nav>
            <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} end>
              <Bot size={20} /> Bot Paneli
            </NavLink>
            <NavLink to="/lists" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <List size={20} /> Siyahılar
            </NavLink>
            <NavLink to="/settings" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Settings size={20} /> Tənzimləmələr
            </NavLink>
            <NavLink to="/logs" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Activity size={20} /> Xəta.log
            </NavLink>
          </nav>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/lists/:id" element={<ListDetailsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/logs" element={<LogsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
