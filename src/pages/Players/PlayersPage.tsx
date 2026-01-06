import { Users } from 'lucide-react';

export function PlayersPage() {
    return (
        <div className="page-content">
            <div className="placeholder-page">
                <div className="placeholder-icon" style={{ background: 'rgba(249, 115, 22, 0.15)' }}>
                    <Users size={40} color="#f97316" />
                </div>
                <h1>Players</h1>
                <p>Manage players and view their profiles.</p>
            </div>
        </div>
    );
}
