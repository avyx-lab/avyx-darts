import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { useGameStore } from '../../stores/gameStore';
import { Card, CardBody, Button } from '@avyx/core';
import { Target, Play, BarChart2, Users, Clock } from 'lucide-react';
import './HomePage.css';

export function HomePage() {
    const navigate = useNavigate();
    const players = usePlayerStore((s) => s.players);
    const currentGame = useGameStore((s) => s.currentGame);
    const gameHistory = useGameStore((s) => s.gameHistory);

    const totalGames = gameHistory.length;
    const recentGames = gameHistory.slice(0, 3);

    return (
        <div className="page-content home-page">
            <h1>Darts</h1>
            <p className="page-description">Track your darts games and analyze your performance.</p>

            {/* Current Game Banner */}
            {currentGame && (
                <Card className="current-game-card">
                    <CardBody>
                        <div className="current-game-content">
                            <div>
                                <h3>🎮 Game in Progress</h3>
                                <p>{currentGame.config.startScore} - {currentGame.config.playerIds.length} players</p>
                            </div>
                            <Button onClick={() => navigate('/game/active')}>
                                Continue
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Stats Grid */}
            <div className="stats-grid">
                <Card>
                    <CardBody>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
                                <Target size={24} color="#6366f1" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{totalGames}</span>
                                <span className="stat-label">Games Played</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                                <Users size={24} color="#22c55e" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{players.length}</span>
                                <span className="stat-label">Players</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.15)' }}>
                                <BarChart2 size={24} color="#f97316" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">-</span>
                                <span className="stat-label">Avg Score</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Quick Actions */}
            <section className="recent-section">
                <h2>Quick Start</h2>
                <div className="button-row">
                    <Button
                        variant="primary"
                        leftIcon={<Play size={18} />}
                        onClick={() => navigate('/game')}
                    >
                        New Game
                    </Button>
                    <Button
                        variant="secondary"
                        leftIcon={<Users size={18} />}
                        onClick={() => navigate('/players')}
                    >
                        Manage Players
                    </Button>
                </div>
            </section>

            {/* Recent Games */}
            {recentGames.length > 0 && (
                <section className="recent-section">
                    <h2>Recent Games</h2>
                    <div className="recent-games">
                        {recentGames.map((game) => (
                            <Card key={game.id}>
                                <CardBody>
                                    <div className="recent-game-item">
                                        <span className="game-type-badge">{game.config.startScore}</span>
                                        <span className="game-players">{game.playerIds.length} players</span>
                                        <span className="game-date">
                                            {new Date(game.finishedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
