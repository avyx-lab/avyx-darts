import { Card, CardBody, Button } from '@avyx/core';
import { Target, Play, BarChart2, Users } from 'lucide-react';

export function HomePage() {
    return (
        <div className="page-content">
            <h1>Darts</h1>
            <p className="page-description">Track your darts games and analyze your performance.</p>

            <div className="stats-grid">
                <Card>
                    <CardBody>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
                                <Target size={24} color="#6366f1" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">23</span>
                                <span className="stat-label">Games Played</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                                <BarChart2 size={24} color="#22c55e" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">87%</span>
                                <span className="stat-label">Accuracy</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.15)' }}>
                                <Users size={24} color="#f97316" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">4</span>
                                <span className="stat-label">Players</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <section className="recent-section">
                <h2>Quick Actions</h2>
                <div className="button-row">
                    <Button variant="primary" leftIcon={<Play size={18} />}>New Game</Button>
                    <Button variant="secondary">View History</Button>
                </div>
            </section>
        </div>
    );
}
