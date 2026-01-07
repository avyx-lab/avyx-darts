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
    const { currentGame, recordScore, recordThrow, undo, abandonGame } = useGameStore();
    const { inputMode, setInputMode, showDynamicCheckout, layoutMode } = useDartsSettingsStore();
    const players = usePlayerStore((s) => s.players);

    const [pendingDarts, setPendingDarts] = useState<Dart[]>([]);
    const [celebratingPlayerId, setCelebratingPlayerId] = useState<string | undefined>();
    const [celebrationType, setCelebrationType] = useState<'180' | 'leg-win' | 'set-win' | 'game-win' | undefined>();
    const [showAbandonModal, setShowAbandonModal] = useState(false);



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


    // History Modal State
    const [historyPlayerId, setHistoryPlayerId] = useState<string | null>(null);

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
                <Scoreboard game={currentGame} />
                <div className="finished-actions">
                    <Button variant="primary" onClick={() => navigate('/game')}>
                        New Game
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/home')}>
                        Back to Home
                    </Button>
                </div>
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
