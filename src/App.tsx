import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout, type NavItem } from '@avyx/core';
import { Home, Target, BarChart2, Users } from 'lucide-react';
import { HomePage } from './pages/Home/HomePage';
import { GamePage } from './pages/Game/GamePage';
import { StatsPage } from './pages/Stats/StatsPage';
import { PlayersPage } from './pages/Players/PlayersPage';

const navItems: NavItem[] = [
    { icon: Home, label: 'Home', to: '/home' },
    { icon: Target, label: 'New Game', to: '/game' },
    { icon: BarChart2, label: 'Statistics', to: '/stats' },
    { icon: Users, label: 'Players', to: '/players' },
];

function App() {
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
                    <Route path="/game" element={<GamePage />} />
                    <Route path="/stats" element={<StatsPage />} />
                    <Route path="/players" element={<PlayersPage />} />
                </Routes>
            </DashboardLayout>
        </HashRouter>
    );
}

export default App;
