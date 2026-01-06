import { BarChart2 } from 'lucide-react';

export function StatsPage() {
    return (
        <div className="page-content">
            <div className="placeholder-page">
                <div className="placeholder-icon" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                    <BarChart2 size={40} color="#22c55e" />
                </div>
                <h1>Statistics</h1>
                <p>View detailed statistics and performance analytics.</p>
            </div>
        </div>
    );
}
