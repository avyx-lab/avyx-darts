import type { ThrowRound } from '../../types/darts';
import './ThrowHistory.css';

interface ThrowHistoryProps {
    playerId: string;
    playerName: string;
    playerAvatar: string;
    rounds: ThrowRound[];
    isExpanded: boolean;
    onToggle: () => void;
    side: 'left' | 'right';
}

// Format dart name (e.g., T20, S5, D16, Bull, D-Bull)
function formatDartName(dart: { segment: number; multiplier: number }): string {
    if (dart.segment === 25) {
        return dart.multiplier === 2 ? 'D-Bull' : 'Bull';
    }
    const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : 'S';
    return `${prefix}${dart.segment}`;
}

export function ThrowHistory({
    playerName,
    playerAvatar,
    rounds,
    isExpanded,
    onToggle,
    side
}: ThrowHistoryProps) {
    // Calculate average
    const totalThrown = rounds.reduce((sum, r) => sum + r.total, 0);
    const average = rounds.length > 0 ? (totalThrown / rounds.length).toFixed(1) : '-';

    return (
        <div className={`throw-history throw-history-${side} ${isExpanded ? 'expanded' : 'collapsed'}`}>
            {/* Header - always visible, click to expand/collapse on mobile */}
            <button className="history-header" onClick={onToggle}>
                <span className="player-avatar">{playerAvatar}</span>
                <span className="player-name">{playerName}</span>
                <span className="player-avg">Ø {average}</span>
                <span className="expand-icon">{isExpanded ? '◂' : '▸'}</span>
            </button>

            {/* Round list - only visible when expanded */}
            <div className="history-content">
                {rounds.length === 0 ? (
                    <div className="no-rounds">Keine Würfe</div>
                ) : (
                    <div className="rounds-list">
                        {rounds.slice().reverse().map((round, index) => (
                            <div
                                key={index}
                                className={`round-row ${round.isBust ? 'bust' : ''} ${round.isCheckout ? 'checkout' : ''}`}
                            >
                                <span className="round-number">#{rounds.length - index}</span>
                                <span className="round-total">{round.total}</span>
                                <span className="round-darts">
                                    {round.darts.map((d, i) => (
                                        <span key={i} className="dart-chip">{formatDartName(d)}</span>
                                    ))}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
