import { useEffect, useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { useDartsSettingsStore } from '../../stores/settingsStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useTranslation } from '../../lib/i18n';
import { Scoreboard } from '../../components/Scoreboard/Scoreboard';
import { NumPad } from '../../components/NumPad/NumPad';
import { DartInput } from '../../components/DartInput/DartInput';
import { PlayerPanel } from '../../components/PlayerPanel/PlayerPanel';
import { Button, Card, CardBody } from '@avyx/core';
import { X, AlertTriangle } from 'lucide-react';
import type { Dart } from '../../types/darts';
import { getCheckoutSuggestion } from '../../lib/darts/checkouts';
import { calculateBotTurn } from '../../lib/darts/bot';
import './ActiveGamePage.css';

export function ActiveGamePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { currentGame, recordScore, recordThrow, undo, abandonGame, endGame } = useGameStore();
    const { inputMode, setInputMode, showDynamicCheckout, layoutMode } = useDartsSettingsStore();
    const players = usePlayerStore((s) => s.players);

    const [pendingDarts, setPendingDarts] = useState<Dart[]>([]);
    const [celebratingPlayerId, setCelebratingPlayerId] = useState<string | undefined>();
    const [celebrationType, setCelebrationType] = useState<'180' | 'leg-win' | 'set-win' | 'game-win' | undefined>();
    const [showAbandonModal, setShowAbandonModal] = useState(false);
    const [historyPlayerId, setHistoryPlayerId] = useState<string | null>(null);



    const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 900);

    useEffect(() => {
        const handleResize = () => setIsWideScreen(window.innerWidth > 900);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const effectiveLayout = useMemo(() => {
        if (layoutMode === 'auto') {
            return isWideScreen ? 'side-by-side' : 'stacked';
        }
        return layoutMode;
    }, [layoutMode, isWideScreen]);

    const currentPlayerId = currentGame?.config.playerIds[currentGame.currentPlayerIndex];
    const currentPlayer = players.find(p => p.id === currentPlayerId);
    const currentScore = useMemo(() => {
        if (!currentGame || !currentPlayerId) return 0;
        const leg = currentGame.sets[currentGame.currentSetIndex].legs[currentGame.currentLegIndex];
        return leg.scores[currentPlayerId] || 0;
    }, [currentGame, currentPlayerId]);

    const dynamicCheckout = useMemo(() => {
        if (!showDynamicCheckout || !currentScore) return null;
        const pendingScore = pendingDarts.reduce((sum, d) => sum + d.value, 0);
        const remaining = currentScore - pendingScore;
        if (remaining < 2 || remaining > 170) return null;
        return getCheckoutSuggestion(remaining, currentPlayer?.preferredDouble);
    }, [showDynamicCheckout, currentScore, pendingDarts, currentPlayer?.preferredDouble]);

    // Keyboard support
    useEffect(() => {
        if (!currentGame || inputMode !== 'round') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key >= '0' && e.key <= '9') {
                const numpadBtn = document.querySelector(`.numpad-btn[data-key="${e.key}"]`) as HTMLButtonElement;
                if (numpadBtn) numpadBtn.click();
            }
            if (e.key === 'Enter') {
                const confirmBtn = document.querySelector('.confirm-btn') as HTMLButtonElement;
                if (confirmBtn && !confirmBtn.disabled) confirmBtn.click();
            }
            if (e.key === 'Backspace') {
                const backspaceBtn = document.querySelector('.backspace-btn') as HTMLButtonElement;
                if (backspaceBtn) backspaceBtn.click();
            }
            if (e.key === 'Escape') {
                const clearBtn = document.querySelector('.clear-btn') as HTMLButtonElement;
                if (clearBtn) clearBtn.click();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentGame, inputMode]);

    // Clear celebration after timeout
    useEffect(() => {
        if (celebratingPlayerId) {
            const timer = setTimeout(() => {
                setCelebratingPlayerId(undefined);
                setCelebrationType(undefined);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [celebratingPlayerId]);

    const triggerCelebration = (playerId: string, type: '180' | 'leg-win' | 'set-win' | 'game-win') => {
        setCelebratingPlayerId(playerId);
        setCelebrationType(type);
    };

    // Bot Logic
    const [isBotThrowing, setIsBotThrowing] = useState(false);

    useEffect(() => {
        if (!currentGame || currentGame.status !== 'active') return;

        const currentPlayerId = currentGame.config.playerIds[currentGame.currentPlayerIndex];
        const playerType = currentGame.config.playerTypes?.[currentPlayerId];
        const difficulty = currentGame.config.botDifficulties?.[currentPlayerId];

        if (playerType === 'computer' && difficulty) {
            setIsBotThrowing(true);

            // Simulate "thinking" and throwing time
            const timer = setTimeout(() => {
                const currentLeg = currentGame.sets[currentGame.currentSetIndex].legs[currentGame.currentLegIndex];
                const score = currentLeg.scores[currentPlayerId];

                const darts = calculateBotTurn(difficulty, score, currentGame.config.outMode);

                const total = darts.reduce((sum: number, d: Dart) => sum + d.value, 0);

                if (total === 180) {
                    triggerCelebration(currentPlayerId, '180');
                }
                if (score === total) {
                    triggerCelebration(currentPlayerId, 'leg-win');
                }

                recordThrow(darts);
                setIsBotThrowing(false);
            }, 1000 + Math.random() * 1000); // 1-2s delay

            return () => clearTimeout(timer);
        } else {
            setIsBotThrowing(false);
        }
    }, [currentGame?.currentPlayerIndex, currentGame?.status, currentGame?.currentLegIndex, currentGame?.currentSetIndex]); // Dependencies for bot turn

    // Disable input if bot is throwing
    const inputDisabled = isBotThrowing;

    const handleScore = useCallback((score: number) => {
        if (score === 180 && currentPlayerId) {
            triggerCelebration(currentPlayerId, '180');
        }

        // Check if this will win the leg
        if (currentScore === score && currentPlayerId) {
            triggerCelebration(currentPlayerId, 'leg-win');
        }

        recordScore(score);
    }, [recordScore, currentPlayerId, currentScore]);

    const handleDarts = useCallback((darts: Dart[]) => {
        const total = darts.reduce((sum, d) => sum + d.value, 0);

        if (total === 180 && currentPlayerId) {
            triggerCelebration(currentPlayerId, '180');
        }

        // Check if this will win the leg
        if (currentScore === total && currentPlayerId) {
            triggerCelebration(currentPlayerId, 'leg-win');
        }

        recordThrow(darts);
        setPendingDarts([]);
    }, [recordThrow, currentPlayerId, currentScore]);

    const handleDartInput = useCallback((darts: Dart[]) => {
        setPendingDarts(darts);
    }, []);

    if (!currentGame) {
        return (
            <div className="page-content no-game">
                <h1>{t('game.noActiveGame')}</h1>
                <p>{t('game.startNewGame')}</p>
                <Button onClick={() => navigate('/game')}>{t('game.newGame')}</Button>
            </div>
        );
    }

    const confirmAbandon = () => {
        abandonGame();
        navigate('/home');
    };

    if (currentGame.status === 'finished') {
        // Find the winner (player with most set wins or leg wins)
        const winnerId = Object.entries(currentGame.setWins)
            .sort(([, a], [, b]) => b - a)[0]?.[0]
            || Object.entries(currentGame.sets[currentGame.currentSetIndex]?.legWins || {})
                .sort(([, a], [, b]) => b - a)[0]?.[0];
        const winner = players.find(p => p.id === winnerId);

        // Calculate extended stats for each player
        const playerStats = currentGame.config.playerIds.map(playerId => {
            let player = players.find(p => p.id === playerId);
            if (!player && playerId === 'bot') {
                player = { id: 'bot', name: 'Computer', avatar: '🤖', preferredDouble: 20, createdAt: '', stats: { gamesPlayed: 0, gamesWon: 0, legsWon: 0, highestCheckout: 0, average: 0, checkoutPercentage: 0, total180s: 0 } };
            }

            let totalPoints = 0;
            let dartsThrown = 0;
            let legsWon = 0;
            let setsWon = currentGame.setWins[playerId] || 0;
            let total100Plus = 0;
            let total120Plus = 0;
            let total140Plus = 0;
            let total180s = 0;
            let highestCheckout = 0;
            let checkoutAttempts = 0;
            let checkoutHits = 0;

            currentGame.sets.forEach(setData => {
                legsWon += setData.legWins[playerId] || 0;
                setData.legs.forEach(leg => {
                    leg.history
                        .filter(round => round.playerId === playerId)
                        .forEach(round => {
                            totalPoints += round.total;
                            dartsThrown += round.darts.length;

                            if (round.total >= 100 && round.total < 120) total100Plus++;
                            if (round.total >= 120 && round.total < 140) total120Plus++;
                            if (round.total >= 140 && round.total < 180) total140Plus++;
                            if (round.total === 180) total180s++;

                            if (round.isCheckout && round.total > highestCheckout) {
                                highestCheckout = round.total;
                            }
                            if (round.scoreAtStart <= 170) {
                                checkoutAttempts++;
                                if (round.isCheckout) checkoutHits++;
                            }
                        });
                });
            });

            const average = dartsThrown > 0 ? (totalPoints / dartsThrown) * 3 : 0;
            const checkoutQuote = checkoutAttempts > 0 ? ((checkoutHits / checkoutAttempts) * 100) : 0;
            const isWinner = playerId === winnerId;

            return {
                playerId, player, dartsThrown, average, legsWon, setsWon, isWinner,
                total100Plus, total120Plus, total140Plus, total180s, highestCheckout, checkoutQuote
            };
        });

        return (
            <div className="page-content game-finished">
                <div className="winner-banner">
                    <div className="winner-crown">👑</div>
                    <h1>🏆 Game Over!</h1>
                    {winner && (
                        <div className="winner-info">
                            <span className="winner-avatar">{winner.avatar}</span>
                            <span className="winner-name">{winner.name} wins!</span>
                        </div>
                    )}
                </div>

                {/* Stats Comparison Table */}
                <div className="stats-comparison-table">
                    <table>
                        <thead>
                            <tr>
                                <th className="stat-label-col"></th>
                                {playerStats.map(({ playerId, player, isWinner }) => (
                                    <th
                                        key={playerId}
                                        className={`player-col ${isWinner ? 'winner' : ''}`}
                                        onClick={() => setHistoryPlayerId(playerId)}
                                    >
                                        <span className="player-avatar">{player?.avatar || '🎯'}</span>
                                        <span className="player-name">{player?.name || 'Unknown'}</span>
                                        {isWinner && <span className="crown">👑</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="stat-label">Darts</td>
                                {playerStats.map(({ playerId, dartsThrown }) => (
                                    <td key={playerId} className="stat-value">{dartsThrown}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="stat-label">Average</td>
                                {playerStats.map(({ playerId, average }) => (
                                    <td key={playerId} className="stat-value highlight">{average.toFixed(1)}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="stat-label">Legs</td>
                                {playerStats.map(({ playerId, legsWon }) => (
                                    <td key={playerId} className="stat-value">{legsWon}</td>
                                ))}
                            </tr>
                            {currentGame.config.setsToWin && (
                                <tr>
                                    <td className="stat-label">Sets</td>
                                    {playerStats.map(({ playerId, setsWon }) => (
                                        <td key={playerId} className="stat-value">{setsWon}</td>
                                    ))}
                                </tr>
                            )}
                            <tr>
                                <td className="stat-label">180s</td>
                                {playerStats.map(({ playerId, total180s }) => (
                                    <td key={playerId} className="stat-value">{total180s}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="stat-label">140+</td>
                                {playerStats.map(({ playerId, total140Plus }) => (
                                    <td key={playerId} className="stat-value">{total140Plus}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="stat-label">120+</td>
                                {playerStats.map(({ playerId, total120Plus }) => (
                                    <td key={playerId} className="stat-value">{total120Plus}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="stat-label">100+</td>
                                {playerStats.map(({ playerId, total100Plus }) => (
                                    <td key={playerId} className="stat-value">{total100Plus}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="stat-label">Best CO</td>
                                {playerStats.map(({ playerId, highestCheckout }) => (
                                    <td key={playerId} className="stat-value">{highestCheckout || '-'}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="stat-label">CO Quote</td>
                                {playerStats.map(({ playerId, checkoutQuote }) => (
                                    <td key={playerId} className="stat-value">{checkoutQuote > 0 ? `${checkoutQuote.toFixed(1)}%` : '-'}</td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                    <p className="table-hint">Tap a player to view their throw history</p>
                </div>

                <div className="finished-actions">
                    <Button variant="primary" onClick={() => {
                        endGame(); // Save stats and clear game
                        navigate('/game');
                    }}>
                        Finish & New Game
                    </Button>
                    <Button variant="ghost" onClick={() => {
                        endGame(); // Save stats and clear game
                        navigate('/home');
                    }}>
                        Finish & Back to Home
                    </Button>
                </div>

                {/* History Modal - Just Legs */}
                {historyPlayerId && (() => {
                    const selectedPlayer = players.find(p => p.id === historyPlayerId)
                        || (historyPlayerId === 'bot' ? { id: 'bot', name: 'Computer', avatar: '🤖' } : null);

                    // Collect rounds grouped by leg
                    const legData: Array<{
                        setIndex: number;
                        legIndex: number;
                        rounds: typeof currentGame.sets[0]['legs'][0]['history'];
                        winner: string | undefined;
                    }> = [];

                    currentGame.sets.forEach((setData, setIdx) => {
                        setData.legs.forEach((leg, legIdx) => {
                            const playerRoundsInLeg = leg.history.filter(r => r.playerId === historyPlayerId);
                            if (playerRoundsInLeg.length > 0) {
                                legData.push({
                                    setIndex: setIdx,
                                    legIndex: legIdx,
                                    rounds: playerRoundsInLeg,
                                    winner: leg.winner
                                });
                            }
                        });
                    });

                    const formatDart = (dart: { segment: number; multiplier: number }) => {
                        if (dart.segment === 25) return dart.multiplier === 2 ? 'D-Bull' : 'Bull';
                        const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : 'S';
                        return `${prefix}${dart.segment}`;
                    };

                    return (
                        <div className="modal-overlay" onClick={() => setHistoryPlayerId(null)}>
                            <Card className="history-modal" onClick={(e) => e.stopPropagation()}>
                                <CardBody>
                                    <div className="history-header">
                                        <div className="history-player">
                                            <span className="history-avatar">{selectedPlayer?.avatar}</span>
                                            <span className="history-name">{selectedPlayer?.name} - Throw History</span>
                                        </div>
                                        <button className="close-btn" onClick={() => setHistoryPlayerId(null)}>
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Legs with Rounds */}
                                    <div className="history-legs">
                                        {legData.length === 0 ? (
                                            <p className="no-rounds">No rounds played</p>
                                        ) : (
                                            legData.map(({ setIndex, legIndex, rounds, winner }) => (
                                                <div key={`${setIndex}-${legIndex}`} className="leg-section">
                                                    <div className="leg-header">
                                                        <span className="leg-title">
                                                            {currentGame.config.setsToWin ? `Set ${setIndex + 1} - ` : ''}
                                                            Leg {legIndex + 1}
                                                        </span>
                                                        {winner === historyPlayerId && (
                                                            <span className="leg-won-badge">✓ Won</span>
                                                        )}
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
                                            ))
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    );
                })()}
            </div>
        );
    }

    return (
        <div className={`page-content active-game-page layout-${effectiveLayout}`}>
            {/* Abandon Confirmation Modal */}
            {showAbandonModal && (
                <div className="modal-overlay" onClick={() => setShowAbandonModal(false)}>
                    <Card className="abandon-modal" onClick={(e) => e.stopPropagation()}>
                        <CardBody>
                            <div className="modal-icon">
                                <AlertTriangle size={48} />
                            </div>
                            <h2>{t('game.abandonTitle')}</h2>
                            <p>{t('game.abandonMessage')}</p>
                            <div className="modal-actions">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowAbandonModal(false)}
                                >
                                    {t('game.cancel')}
                                </Button>
                                <button
                                    className="btn-danger"
                                    onClick={confirmAbandon}
                                >
                                    {t('game.abandonConfirm')}
                                </button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            <div className={`game-layout game-layout-${effectiveLayout}`}>
                {/* Left Panel (Player 1) */}
                {currentGame.config.playerIds.length >= 1 && (() => {
                    const playerId = currentGame.config.playerIds[0];
                    const currentLeg = currentGame.sets[currentGame.currentSetIndex].legs[currentGame.currentLegIndex];
                    const currentSet = currentGame.sets[currentGame.currentSetIndex];
                    const playerRounds = currentLeg.history.filter(r => r.playerId === playerId);
                    const score = currentLeg.scores[playerId] || 0;
                    const legWins = currentSet.legWins[playerId] || 0;
                    const setWins = currentGame.setWins[playerId] || 0;
                    const isCurrentPlayer = currentPlayerId === playerId;
                    const isStarter = currentLeg.startingPlayerId === playerId;

                    let player = players.find(p => p.id === playerId);
                    if (!player && playerId === 'bot') {
                        player = { id: 'bot', name: 'Computer', avatar: '🤖', preferredDouble: 20, createdAt: '', stats: { gamesPlayed: 0, gamesWon: 0, legsWon: 0, highestCheckout: 0, average: 0, checkoutPercentage: 0, total180s: 0 } };
                    }

                    const displayScore = isCurrentPlayer && pendingDarts.length > 0
                        ? score - pendingDarts.reduce((sum, d) => sum + d.value, 0)
                        : score;
                    const checkout = displayScore <= 170 && displayScore >= 2
                        ? getCheckoutSuggestion(displayScore, player?.preferredDouble)
                        : null;

                    return player ? (
                        <PlayerPanel
                            player={player}
                            score={score}
                            legWins={legWins}
                            setWins={setWins}
                            rounds={playerRounds}
                            isCurrentPlayer={isCurrentPlayer}
                            isStarter={isStarter}
                            pendingScore={isCurrentPlayer ? pendingDarts.reduce((sum, d) => sum + d.value, 0) : 0}
                            checkout={checkout?.darts}
                            side="left"
                            setsToWin={currentGame.config.setsToWin}
                        />
                    ) : null;
                })()}

                {/* Center: Input only */}
                <div className="game-center">
                    {/* Game info header */}
                    <div className="game-info-bar">
                        <span className="game-mode">{currentGame.config.startScore}</span>
                        <span className="game-status">Leg {currentGame.currentLegIndex + 1} {currentGame.config.setsToWin ? `| Set ${currentGame.currentSetIndex + 1}` : ''}</span>
                        <span className="game-target">First to {currentGame.config.legsToWin} Legs</span>
                    </div>

                    {/* Mobile-only scoreboard */}
                    {effectiveLayout === 'stacked' && (
                        <div className="game-scoreboard">
                            <Scoreboard
                                game={currentGame}
                                dynamicCheckout={dynamicCheckout?.darts}
                                pendingScore={pendingDarts.reduce((sum, d) => sum + d.value, 0)}
                                celebratingPlayerId={celebratingPlayerId}
                                celebrationType={celebrationType}
                                onPlayerClick={(pid) => setHistoryPlayerId(pid)}
                            />
                        </div>
                    )}

                    <div className="game-input-wrapper">
                        <div className="game-controls">
                            <div className="input-mode-toggle">
                                <button
                                    className={`mode-btn ${inputMode === 'round' ? 'active' : ''}`}
                                    onClick={() => setInputMode('round')}
                                >
                                    {t('game.roundScore')}
                                </button>
                                <button
                                    className={`mode-btn ${inputMode === 'dart' ? 'active' : ''}`}
                                    onClick={() => setInputMode('dart')}
                                >
                                    {t('game.perDart')}
                                </button>
                            </div>
                            <button
                                className="btn-abandon"
                                onClick={() => setShowAbandonModal(true)}
                            >
                                <X size={16} />
                                {t('game.abandon')}
                            </button>
                        </div>

                        <div className="game-input">
                            {isBotThrowing && (
                                <div className="bot-overlay">
                                    <div className="bot-thinking">
                                        <span>🤖 Bot is throwing...</span>
                                        <div className="loading-dots">
                                            <span>.</span><span>.</span><span>.</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Right: Player 2 (Desktop) - already handled above */}

                            {/* History Modal (Mobile) */}
                            {historyPlayerId && (
                                <div className="history-modal-overlay" onClick={() => setHistoryPlayerId(null)}>
                                    <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
                                        <button className="history-modal-close" onClick={() => setHistoryPlayerId(null)}>
                                            <X size={24} />
                                        </button>
                                        {(() => {
                                            // Calculate player data for modal
                                            const player = players.find(p => p.id === historyPlayerId) || { id: 'bot', name: 'Computer', avatar: '🤖', preferredDouble: 20, createdAt: '', stats: {} as any };
                                            const leg = currentGame.sets[currentGame.currentSetIndex].legs[currentGame.currentLegIndex];
                                            const score = leg.scores[historyPlayerId] || 0;
                                            const legWins = currentGame.sets[currentGame.currentSetIndex].legWins[historyPlayerId] || 0;
                                            const setWins = currentGame.setWins[historyPlayerId] || 0;
                                            const rounds = leg.history.filter(r => r.playerId === historyPlayerId);
                                            const isCurrentPlayer = currentGame.config.playerIds[currentGame.currentPlayerIndex] === historyPlayerId;
                                            const isStarter = leg.startingPlayerId === historyPlayerId;

                                            return (
                                                <PlayerPanel
                                                    player={player}
                                                    score={score}
                                                    legWins={legWins}
                                                    setWins={setWins}
                                                    rounds={rounds}
                                                    isCurrentPlayer={isCurrentPlayer}
                                                    isStarter={isStarter}
                                                    pendingScore={isCurrentPlayer ? pendingDarts.reduce((sum, d) => sum + d.value, 0) : 0}
                                                    checkout={isCurrentPlayer && dynamicCheckout ? dynamicCheckout.darts : undefined}
                                                    side="left" // Reuse left style, or neutralize in CSS
                                                    setsToWin={currentGame.config.setsToWin}
                                                />
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                            {inputMode === 'round' ? (
                                <NumPad
                                    onScore={handleScore}
                                    onUndo={undo}
                                    maxScore={180}
                                    disabled={inputDisabled}
                                />
                            ) : (
                                <DartInput
                                    onConfirm={handleDarts}
                                    onUndo={undo}
                                    maxDarts={3}
                                    onDartChange={handleDartInput}
                                    disabled={inputDisabled}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel (Player 2) */}
                {currentGame.config.playerIds.length >= 2 && (() => {
                    const playerId = currentGame.config.playerIds[1];
                    const currentLeg = currentGame.sets[currentGame.currentSetIndex].legs[currentGame.currentLegIndex];
                    const currentSet = currentGame.sets[currentGame.currentSetIndex];
                    const playerRounds = currentLeg.history.filter(r => r.playerId === playerId);
                    const score = currentLeg.scores[playerId] || 0;
                    const legWins = currentSet.legWins[playerId] || 0;
                    const setWins = currentGame.setWins[playerId] || 0;
                    const isCurrentPlayer = currentPlayerId === playerId;
                    const isStarter = currentLeg.startingPlayerId === playerId;

                    let player = players.find(p => p.id === playerId);
                    if (!player && playerId === 'bot') {
                        player = { id: 'bot', name: 'Computer', avatar: '🤖', preferredDouble: 20, createdAt: '', stats: { gamesPlayed: 0, gamesWon: 0, legsWon: 0, highestCheckout: 0, average: 0, checkoutPercentage: 0, total180s: 0 } };
                    }

                    const displayScore = isCurrentPlayer && pendingDarts.length > 0
                        ? score - pendingDarts.reduce((sum, d) => sum + d.value, 0)
                        : score;
                    const checkout = displayScore <= 170 && displayScore >= 2
                        ? getCheckoutSuggestion(displayScore, player?.preferredDouble)
                        : null;

                    return player ? (
                        <PlayerPanel
                            player={player}
                            score={score}
                            legWins={legWins}
                            setWins={setWins}
                            rounds={playerRounds}
                            isCurrentPlayer={isCurrentPlayer}
                            isStarter={isStarter}
                            pendingScore={isCurrentPlayer ? pendingDarts.reduce((sum, d) => sum + d.value, 0) : 0}
                            checkout={checkout?.darts}
                            side="right"
                            setsToWin={currentGame.config.setsToWin}
                        />
                    ) : null;
                })()}
            </div>
        </div>
    );
}
