import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { usePlayerStore } from '../../stores/playerStore';
import { Card, CardBody, Button } from '@avyx/core';
import { Calendar, ChevronRight, Trash2, X } from 'lucide-react';
import type { GameSummary, ThrowRound } from '../../types/darts';
import './HistoryPage.css';

export function HistoryPage() {
    const gameHistory = useGameStore((s) => s.gameHistory);
    const clearHistory = useGameStore((s) => s.clearHistory);
    const players = usePlayerStore((s) => s.players);

    const [selectedGame, setSelectedGame] = useState<GameSummary | null>(null);
    const [historyPlayerId, setHistoryPlayerId] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const getPlayerName = (playerId: string) => {
        if (playerId === 'bot') return 'Computer';
        return players.find(p => p.id === playerId)?.name || 'Unknown';
    };

    const getPlayerAvatar = (playerId: string) => {
        if (playerId === 'bot') return '🤖';
        return players.find(p => p.id === playerId)?.avatar || '🎯';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDart = (dart: { segment: number; multiplier: number }) => {
        if (dart.segment === 25) return dart.multiplier === 2 ? 'D-Bull' : 'Bull';
        const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : 'S';
        return `${prefix}${dart.segment}`;
    };

    // Group rounds by leg for a specific player
    const getPlayerLegs = (game: GameSummary, playerId: string) => {
        // Use explicit legs if available (new games)
        if (game.legs) {
            return game.legs.map((leg, index) => ({
                legIndex: index,
                rounds: leg.rounds.filter(r => r.playerId === playerId),
                won: leg.winner === playerId
            })).filter(leg => leg.rounds.length > 0);
        }

        // Fallback for old games (reconstruct from flat rounds)
        if (!game.rounds) return [];

        const legs: Array<{ legIndex: number; rounds: ThrowRound[]; won: boolean }> = [];
        let currentLegIndex = 0;
        let currentLegRounds: ThrowRound[] = [];

        game.rounds.forEach(round => {
            if (round.playerId === playerId) {
                currentLegRounds.push(round);
            }
            // Check if this round ended a leg (checkout)
            if (round.isCheckout) {
                if (currentLegRounds.length > 0) {
                    legs.push({
                        legIndex: currentLegIndex,
                        rounds: [...currentLegRounds],
                        won: round.playerId === playerId
                    });
                }
                currentLegIndex++;
                currentLegRounds = [];
            }
        });

        // Add remaining rounds if any
        if (currentLegRounds.length > 0) {
            legs.push({
                legIndex: currentLegIndex,
                rounds: currentLegRounds,
                won: false
            });
        }

        return legs;
    };

    return (
        <div className="page-content history-page">
            <div className="history-header-row">
                <h1>Game History</h1>
                {gameHistory.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 size={16} />}
                        onClick={() => setShowClearConfirm(true)}
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {gameHistory.length === 0 ? (
                <Card>
                    <CardBody className="empty-history">
                        <Calendar size={48} />
                        <p>No games played yet</p>
                        <p className="hint">Your completed games will appear here</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="history-list">
                    {gameHistory.map((game) => (
                        <div
                            key={game.id}
                            className="history-game-card"
                            onClick={() => setSelectedGame(game)}
                        >
                            <div className="game-info">
                                <div className="game-meta">
                                    <span className="game-type">{game.config.startScore}</span>
                                    <span className="game-date">{formatDate(game.finishedAt)}</span>
                                </div>
                                <div className="game-players">
                                    {game.playerIds.map(playerId => (
                                        <div
                                            key={playerId}
                                            className={`game-player ${playerId === game.winnerId ? 'winner' : ''}`}
                                        >
                                            <span className="player-avatar">{getPlayerAvatar(playerId)}</span>
                                            <span className="player-name">{getPlayerName(playerId)}</span>
                                            {playerId === game.winnerId && <span className="crown">👑</span>}
                                            {game.playerStats?.[playerId] && (
                                                <span className="player-avg">
                                                    Avg: {game.playerStats[playerId].average.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <ChevronRight size={20} className="chevron" />
                        </div>
                    ))}
                </div>
            )}

            {/* Game Detail Modal with Stats Comparison Table */}
            {selectedGame && !historyPlayerId && (
                <div className="modal-overlay" onClick={() => setSelectedGame(null)}>
                    <Card className="game-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <CardBody>
                            <div className="detail-header">
                                <div>
                                    <h2>{selectedGame.config.startScore}</h2>
                                    <span className="detail-date">{formatDate(selectedGame.finishedAt)}</span>
                                </div>
                                <button className="close-btn" onClick={() => setSelectedGame(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Winner Banner - Compact */}
                            <div className="history-winner-banner">
                                <span className="winner-crown">👑</span>
                                <span className="winner-avatar">{getPlayerAvatar(selectedGame.winnerId || '')}</span>
                                <span className="winner-name">{getPlayerName(selectedGame.winnerId || '')} wins!</span>
                            </div>

                            {/* Stats Comparison Table */}
                            <div className="stats-comparison-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th className="stat-label-col"></th>
                                            {selectedGame.playerIds.map(playerId => (
                                                <th
                                                    key={playerId}
                                                    className={`player-col ${playerId === selectedGame.winnerId ? 'winner' : ''}`}
                                                    onClick={() => setHistoryPlayerId(playerId)}
                                                >
                                                    <span className="player-avatar">{getPlayerAvatar(playerId)}</span>
                                                    <span className="player-name">{getPlayerName(playerId)}</span>
                                                    {playerId === selectedGame.winnerId && <span className="crown">👑</span>}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="stat-label">Darts</td>
                                            {selectedGame.playerIds.map(playerId => (
                                                <td key={playerId} className="stat-value">
                                                    {selectedGame.playerStats?.[playerId]?.dartsThrown || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="stat-label">Average</td>
                                            {selectedGame.playerIds.map(playerId => (
                                                <td key={playerId} className="stat-value highlight">
                                                    {selectedGame.playerStats?.[playerId]?.average.toFixed(1) || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="stat-label">Legs</td>
                                            {selectedGame.playerIds.map(playerId => (
                                                <td key={playerId} className="stat-value">
                                                    {selectedGame.playerStats?.[playerId]?.legsWon || 0}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="stat-label">180s</td>
                                            {selectedGame.playerIds.map(playerId => (
                                                <td key={playerId} className="stat-value">
                                                    {selectedGame.playerStats?.[playerId]?.total180s || 0}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="stat-label">140+</td>
                                            {selectedGame.playerIds.map(playerId => (
                                                <td key={playerId} className="stat-value">
                                                    {selectedGame.playerStats?.[playerId]?.total140Plus || 0}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="stat-label">120+</td>
                                            {selectedGame.playerIds.map(playerId => (
                                                <td key={playerId} className="stat-value">
                                                    {selectedGame.playerStats?.[playerId]?.total120Plus || 0}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="stat-label">100+</td>
                                            {selectedGame.playerIds.map(playerId => (
                                                <td key={playerId} className="stat-value">
                                                    {selectedGame.playerStats?.[playerId]?.total100Plus || 0}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="stat-label">Best CO</td>
                                            {selectedGame.playerIds.map(playerId => (
                                                <td key={playerId} className="stat-value">
                                                    {selectedGame.playerStats?.[playerId]?.highestCheckout || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="stat-label">CO Quote</td>
                                            {selectedGame.playerIds.map(playerId => {
                                                const quote = selectedGame.playerStats?.[playerId]?.checkoutQuote;
                                                return (
                                                    <td key={playerId} className="stat-value">
                                                        {quote && quote > 0 ? `${quote.toFixed(1)}%` : '-'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                                <p className="table-hint">Tap a player to view their throw history</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Player History Modal */}
            {selectedGame && historyPlayerId && (
                <div className="modal-overlay" onClick={() => setHistoryPlayerId(null)}>
                    <Card className="history-modal" onClick={(e) => e.stopPropagation()}>
                        <CardBody>
                            <div className="history-header">
                                <div className="history-player">
                                    <span className="history-avatar">{getPlayerAvatar(historyPlayerId)}</span>
                                    <span className="history-name">{getPlayerName(historyPlayerId)} - Throw History</span>
                                </div>
                                <button className="close-btn" onClick={() => setHistoryPlayerId(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="history-legs">
                                {getPlayerLegs(selectedGame, historyPlayerId).map(({ legIndex, rounds, won }) => (
                                    <div key={legIndex} className="leg-section">
                                        <div className="leg-header">
                                            <span className="leg-title">Leg {legIndex + 1}</span>
                                            {won && <span className="leg-won-badge">✓ Won</span>}
                                        </div>
                                        <div className="leg-rounds">
                                            {rounds.map((round, idx) => (
                                                <div key={idx} className={`history-round ${round.isCheckout ? 'checkout' : ''} ${round.isBust ? 'bust' : ''}`}>
                                                    <span className="round-number">#{idx + 1}</span>
                                                    <span className="round-total">{round.total}</span>
                                                    <span className="round-darts">
                                                        {round.darts.map((d, i) => (
                                                            <span key={i} className="dart-tag">{formatDart(d)}</span>
                                                        ))}
                                                    </span>
                                                    <span className="round-remaining">→ {round.remainingAfter}</span>
                                                    {round.isCheckout && <span className="checkout-badge">✓</span>}
                                                    {round.isBust && <span className="bust-badge">BUST</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Clear Confirmation Modal */}
            {showClearConfirm && (
                <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
                    <Card className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <CardBody>
                            <h2>Clear History?</h2>
                            <p>This will delete all {gameHistory.length} games from your history. This action cannot be undone.</p>
                            <div className="modal-actions">
                                <Button variant="ghost" onClick={() => setShowClearConfirm(false)}>
                                    Cancel
                                </Button>
                                <button
                                    className="btn-danger"
                                    onClick={() => {
                                        clearHistory();
                                        setShowClearConfirm(false);
                                    }}
                                >
                                    Clear All
                                </button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
}
