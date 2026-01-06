import { usePlayerStore } from '../../stores/playerStore';
import type { X01GameState } from '../../types/darts';
import { getCheckoutSuggestion } from '../../lib/darts/checkouts';
import './Scoreboard.css';

interface ScoreboardProps {
    game: X01GameState;
    dynamicCheckout?: string[];
    pendingScore?: number;
    celebratingPlayerId?: string;  // Player who just scored 180 or won
    celebrationType?: '180' | 'leg-win' | 'set-win' | 'game-win';
}

// Get suggestion for reaching a checkable score
function getCheckableSuggestion(score: number): string | null {
    if (score <= 170) return null; // Already checkable

    // Common targets to reach a checkable score
    const checkableTargets = [170, 167, 164, 161, 160, 158, 157, 156, 155, 154, 152, 151, 150];

    for (const target of checkableTargets) {
        const needed = score - target;
        if (needed <= 180 && needed > 0) {
            // Suggest what to throw
            if (needed === 180) return 'T20 T20 T20 → Checkout';
            if (needed >= 120 && needed <= 180) {
                const remaining = needed - 120;
                if (remaining <= 60) return `T20 T20 + ${remaining} → Checkout`;
            }
            if (needed >= 60 && needed < 120) {
                const remaining = needed - 60;
                if (remaining <= 60) return `T20 + ${remaining} → Checkout`;
            }
            return null;
        }
    }
    return null;
}

export function Scoreboard({
    game,
    dynamicCheckout,
    pendingScore = 0,
    celebratingPlayerId,
    celebrationType
}: ScoreboardProps) {
    const players = usePlayerStore((s) => s.players);
    const currentSet = game.sets[game.currentSetIndex];
    const currentLeg = currentSet.legs[game.currentLegIndex];

    return (
        <div className="scoreboard">
            <div className="scoreboard-header">
                <span className="game-type">{game.config.startScore}</span>
                {game.config.setsToWin && (
                    <span className="sets-info">
                        First to {game.config.setsToWin} Sets
                    </span>
                )}
                <span className="legs-info">
                    First to {game.config.legsToWin} Legs
                </span>
            </div>

            <div className="scoreboard-players">
                {game.config.playerIds.map((playerId, index) => {
                    const player = players.find((p) => p.id === playerId);
                    const baseScore = currentLeg.scores[playerId];
                    const isCurrentPlayer = index === game.currentPlayerIndex;
                    const legWins = currentSet.legWins[playerId] || 0;
                    const setWins = game.setWins[playerId] || 0;
                    const isCelebrating = celebratingPlayerId === playerId;

                    // For current player, show score minus pending
                    const displayScore = isCurrentPlayer && pendingScore > 0
                        ? baseScore - pendingScore
                        : baseScore;

                    // Get checkout suggestion - use dynamic for current player if available
                    let checkout: { darts: string[] } | null = null;
                    let checkableSuggestion: string | null = null;

                    if (isCurrentPlayer && dynamicCheckout) {
                        checkout = { darts: dynamicCheckout };
                    } else if (displayScore <= 170 && displayScore >= 2) {
                        checkout = getCheckoutSuggestion(displayScore, player?.preferredDouble);
                    } else if (displayScore > 170) {
                        checkableSuggestion = getCheckableSuggestion(displayScore);
                    }

                    return (
                        <div
                            key={playerId}
                            className={`player-score ${isCurrentPlayer ? 'active' : ''} ${isCelebrating ? `celebrating celebrating-${celebrationType}` : ''}`}
                        >
                            {/* Celebration overlay inside player card */}
                            {isCelebrating && (
                                <div className="player-celebration">
                                    {celebrationType === '180' && <span>🎯 180!</span>}
                                    {celebrationType === 'leg-win' && <span>🏆 Leg!</span>}
                                    {celebrationType === 'set-win' && <span>🏆 Set!</span>}
                                    {celebrationType === 'game-win' && <span>👑 Winner!</span>}
                                </div>
                            )}

                            <div className="player-info">
                                <span className="player-avatar">{player?.avatar || '🎯'}</span>
                                <span className="player-name">{player?.name || 'Unknown'}</span>
                            </div>

                            <div className="score-display">
                                <div className="score-row">
                                    <span className="current-score">{displayScore}</span>
                                    {isCurrentPlayer && pendingScore > 0 && (
                                        <span className="pending-score">(-{pendingScore})</span>
                                    )}
                                </div>
                                {checkout && (
                                    <span className="checkout-hint">
                                        {checkout.darts.join(' → ')}
                                    </span>
                                )}
                                {checkableSuggestion && (
                                    <span className="checkable-hint">
                                        {checkableSuggestion}
                                    </span>
                                )}
                            </div>

                            <div className="win-counts">
                                {game.config.setsToWin && (
                                    <span className="set-wins">{setWins} Sets</span>
                                )}
                                <span className="leg-wins">{legWins} Legs</span>
                            </div>

                            {isCurrentPlayer && <div className="throw-indicator">▶</div>}
                        </div>
                    );
                })}
            </div>

            <div className="scoreboard-footer">
                <span>Leg {game.currentLegIndex + 1}</span>
                {game.config.setsToWin && (
                    <span>Set {game.currentSetIndex + 1}</span>
                )}
            </div>
        </div>
    );
}
