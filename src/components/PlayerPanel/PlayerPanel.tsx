import type { Player, ThrowRound } from '../../types/darts';
import './PlayerPanel.css';

interface PlayerPanelProps {
    player: Player;
    score: number;
    legWins: number;
    setWins?: number;
    rounds: ThrowRound[];
    isCurrentPlayer: boolean;
    isStarter: boolean;
    pendingScore?: number;
    checkout?: string[];
    side: 'left' | 'right';
    setsToWin?: number;
}

// Format dart name (e.g., T20, S5, D16, Bull, D-Bull)
function formatDartName(dart: { segment: number; multiplier: number }): string {
    if (dart.segment === 25) {
        return dart.multiplier === 2 ? 'D-Bull' : 'Bull';
    }
    if (dart.segment === 0) return 'Miss';
    const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : 'S';
    return `${prefix}${dart.segment}`;
}

export function PlayerPanel({
    player,
    score,
    legWins,
    setWins,
    rounds,
    isCurrentPlayer,
    isStarter,
    pendingScore = 0,
    checkout,
    side,
    setsToWin
}: PlayerPanelProps) {
    // Calculate average
    const totalThrown = rounds.reduce((sum, r) => sum + r.total, 0);
    const average = rounds.length > 0 ? (totalThrown / rounds.length).toFixed(1) : '-';

    // Display score (minus pending if current player)
    const displayScore = isCurrentPlayer && pendingScore > 0 ? score - pendingScore : score;

    return (
        <div className={`player-panel player-panel-${side} ${isCurrentPlayer ? 'active' : ''}`}>
            {/* Header with player info */}
            <div className="panel-header">
                {isStarter && <div className="starter-marker" title="Begonnen" />}
                <span className="panel-avatar">{player.avatar}</span>
                <span className="panel-name">{player.name}</span>
                <span className="panel-avg">Ø {average}</span>
            </div>

            {/* Score display */}
            <div className="panel-score">
                <div className="score-main">
                    <span className="score-value">{displayScore}</span>
                    {isCurrentPlayer && pendingScore > 0 && (
                        <span className="score-pending">(-{pendingScore})</span>
                    )}
                </div>
                {checkout && checkout.length > 0 && (
                    <div className="score-checkout">
                        {checkout.join(' → ')}
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="panel-stats">
                <div className="stat">
                    <span className="stat-value">{legWins}</span>
                    <span className="stat-label">Legs</span>
                </div>
                {setsToWin && (
                    <div className="stat">
                        <span className="stat-value">{setWins || 0}</span>
                        <span className="stat-label">Sets</span>
                    </div>
                )}
            </div>

            {/* Throw history */}
            <div className="panel-history">
                <div className="history-header">
                    <span>Würfe</span>
                </div>
                <div className="history-list">
                    {rounds.length === 0 ? (
                        <div className="no-throws">-</div>
                    ) : (
                        rounds.map((round, idx) => (
                            <div
                                key={idx}
                                className={`history-row ${round.isBust ? 'bust' : ''} ${round.isCheckout ? 'checkout' : ''}`}
                            >
                                <span className="row-number">#{idx + 1}</span>
                                <span className="row-score-start">{round.scoreAtStart}</span>
                                <span className="row-total">{round.total}</span>
                                <span className="row-darts">
                                    {round.darts.map((d, i) => (
                                        <span key={i} className="dart-chip">{formatDartName(d)}</span>
                                    ))}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Current turn indicator */}
            {isCurrentPlayer && <div className="turn-indicator">▶</div>}
        </div>
    );
}
