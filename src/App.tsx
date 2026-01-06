import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@avyx/core';
import { HomePage } from './pages/Home/HomePage';
import { GamePage } from './pages/Game/GamePage';
import { StatsPage } from './pages/Stats/StatsPage';
import { PlayersPage } from './pages/Players/PlayersPage';

function App() {
    return (
        <HashRouter>
            <DashboardLayout>
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
