import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout, type NavItem } from '@avyx/core';
import { Home, Target, BarChart2, Users, Settings, List, Clock } from 'lucide-react';
import { HomePage } from './pages/Home/HomePage';
import { NewGamePage } from './pages/Game/NewGamePage';
import { ActiveGamePage } from './pages/Game/ActiveGamePage';
import { StatsPage } from './pages/Stats/StatsPage';
import { PlayersPage } from './pages/Players/PlayersPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { CheckoutsPage } from './pages/Checkouts/CheckoutsPage';
import { HistoryPage } from './pages/History/HistoryPage';
import { keepScreenOn, allowScreenOff } from './lib/mobile/keepAwake';
import './pages/Home/HomePage.css';
import './pages/Players/PlayersPage.css';
import './pages/Game/NewGamePage.css';
import './pages/Game/ActiveGamePage.css';
import './pages/Settings/SettingsPage.css';
import './pages/Checkouts/CheckoutsPage.css';
import './pages/History/HistoryPage.css';

const navItems: NavItem[] = [
    { icon: Home, label: 'Home', to: '/home' },
    { icon: Target, label: 'New Game', to: '/game' },
    { icon: Clock, label: 'History', to: '/history' },
    { icon: List, label: 'Checkouts', to: '/checkouts' },
    { icon: BarChart2, label: 'Statistics', to: '/stats' },
    { icon: Users, label: 'Players', to: '/players' },
    { icon: Settings, label: 'Settings', to: '/settings' },
];

function App() {
    useEffect(() => {
        // Keep screen on for mobile app
        keepScreenOn();
        return () => {
            allowScreenOff();
        };
    }, []);

    return (
        <HashRouter>
            <DashboardLayout
                navItems={navItems}
                appName="Avyx Darts"
                appIcon="🎯"
            >
                <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/game" element={<NewGamePage />} />
                    <Route path="/game/active" element={<ActiveGamePage />} />
                    <Route path="/checkouts" element={<CheckoutsPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/stats" element={<StatsPage />} />
                    <Route path="/players" element={<PlayersPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Routes>
            </DashboardLayout>
        </HashRouter>
    );
}

export default App;
