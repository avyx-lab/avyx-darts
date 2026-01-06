import { Target } from 'lucide-react';

export function GamePage() {
    return (
        <div className="page-content">
            <div className="placeholder-page">
                <div className="placeholder-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
                    <Target size={40} color="#6366f1" />
                </div>
                <h1>New Game</h1>
                <p>Start a new darts game and track scores in real-time.</p>
            </div>
        </div>
    );
}
