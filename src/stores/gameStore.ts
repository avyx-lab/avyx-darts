import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    X01GameState,
    X01GameConfig,
    ThrowRound,
    Dart,
    LegState,
    SetState,
    GameSummary
} from '../types/darts';
import { calculateThrowTotal, isBust } from '../lib/darts/scoring';
import { usePlayerStore } from './playerStore';

// ==========================================
// GAME STORE
// ==========================================

interface GameStore {
    currentGame: X01GameState | null;
    gameHistory: GameSummary[];

    // Game lifecycle
    startGame: (config: X01GameConfig) => void;
    endGame: () => void;
    abandonGame: () => void;

    // Gameplay
    recordThrow: (darts: Dart[]) => void;
    recordScore: (score: number) => void; // Quick score entry
    undo: () => void;

    // Getters
    getCurrentPlayer: () => string | undefined;
    getCurrentScore: (playerId: string) => number;
    getCheckoutSuggestion: (playerId: string) => string[] | null;
}

const generateId = () => crypto.randomUUID();

function createEmptyLeg(playerIds: string[], startScore: number, startingPlayerId: string): LegState {
    const scores: Record<string, number> = {};
    const hasStarted: Record<string, boolean> = {};

    playerIds.forEach((id) => {
        scores[id] = startScore;
        hasStarted[id] = false;
    });

    return {
        scores,
        hasStarted,
        history: [],
        winner: undefined,
        startingPlayerId,
    };
}

function createEmptySet(playerIds: string[], startScore: number, startingPlayerId: string): SetState {
    return {
        legs: [createEmptyLeg(playerIds, startScore, startingPlayerId)],
        legWins: Object.fromEntries(playerIds.map((id) => [id, 0])),
        winner: undefined,
    };
}

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            currentGame: null,
            gameHistory: [],

            startGame: (config) => {
                const game: X01GameState = {
                    id: generateId(),
                    config,
                    status: 'active',
                    currentPlayerIndex: 0,
                    currentSetIndex: 0,
                    currentLegIndex: 0,
                    sets: [createEmptySet(config.playerIds, config.startScore, config.playerIds[0])],
                    setWins: Object.fromEntries(config.playerIds.map((id) => [id, 0])),
                    winner: undefined,
                    startedAt: new Date().toISOString(),
                };

                set({ currentGame: game });
            },

            endGame: () => {
                const { currentGame } = get();
                if (!currentGame) return;

                // Save to history
                const summary: GameSummary = {
                    id: currentGame.id,
                    gameType: 'x01',
                    config: currentGame.config,
                    playerIds: currentGame.config.playerIds,
                    winnerId: currentGame.winner,
                    startedAt: currentGame.startedAt,
                    finishedAt: new Date().toISOString(),
                };

                // Update player stats
                if (currentGame.winner) {
                    const playerStore = usePlayerStore.getState();
                    currentGame.config.playerIds.forEach((playerId) => {
                        const player = playerStore.getPlayer(playerId);
                        if (player) {
                            playerStore.updateStats(playerId, {
                                gamesPlayed: player.stats.gamesPlayed + 1,
                                gamesWon: player.stats.gamesWon + (playerId === currentGame.winner ? 1 : 0),
                            });
                        }
                    });
                }

                set((state) => ({
                    currentGame: null,
                    gameHistory: [summary, ...state.gameHistory],
                }));
            },

            abandonGame: () => {
                set({ currentGame: null });
            },

            recordThrow: (darts) => {
                const { currentGame } = get();
                if (!currentGame || currentGame.status !== 'active') return;

                const { config, currentPlayerIndex, currentSetIndex, currentLegIndex, sets } = currentGame;
                const playerId = config.playerIds[currentPlayerIndex];
                const currentSet = sets[currentSetIndex];
                const currentLeg = currentSet.legs[currentLegIndex];

                const thrownScore = calculateThrowTotal(darts);
                const remainingBefore = currentLeg.scores[playerId];
                const lastDart = darts[darts.length - 1];

                // Check for bust
                const bust = isBust(remainingBefore, thrownScore, config.outMode, lastDart);

                // Check for valid checkout
                const isCheckout = !bust && thrownScore === remainingBefore;

                // Calculate new remaining
                const remainingAfter = bust ? remainingBefore : remainingBefore - thrownScore;

                // Create throw round
                const throwRound: ThrowRound = {
                    playerId,
                    darts,
                    total: thrownScore,
                    remainingAfter,
                    scoreAtStart: remainingBefore,
                    isCheckout,
                    isBust: bust,
                    timestamp: new Date().toISOString(),
                };

                // Update leg state
                const newLegHistory = [...currentLeg.history, throwRound];
                const newLegScores = { ...currentLeg.scores, [playerId]: remainingAfter };
                const newLegHasStarted = {
                    ...currentLeg.hasStarted,
                    [playerId]: currentLeg.hasStarted[playerId] || thrownScore > 0
                };

                let newLeg: LegState = {
                    ...currentLeg,
                    scores: newLegScores,
                    hasStarted: newLegHasStarted,
                    history: newLegHistory,
                };

                let newSet = { ...currentSet };
                let newSets = [...sets];
                let newSetWins = { ...currentGame.setWins };
                let newPlayerIndex = (currentPlayerIndex + 1) % config.playerIds.length;
                let newSetIndex = currentSetIndex;
                let newLegIndex = currentLegIndex;
                let gameWinner: string | undefined;
                let gameStatus: 'active' | 'finished' = currentGame.status;

                // Handle checkout
                if (isCheckout) {
                    newLeg.winner = playerId;

                    // Update leg wins in set
                    const newLegWins = {
                        ...newSet.legWins,
                        [playerId]: newSet.legWins[playerId] + 1
                    };

                    // Check if player won the set
                    if (newLegWins[playerId] >= config.legsToWin) {
                        newSet.winner = playerId;
                        newSetWins[playerId] = newSetWins[playerId] + 1;

                        // Check if player won the match
                        const setsToWin = config.setsToWin || 1;
                        if (newSetWins[playerId] >= setsToWin) {
                            gameWinner = playerId;
                            gameStatus = 'finished';
                        } else {
                            // Start new set - alternate starter
                            newSetIndex++;
                            newLegIndex = 0;
                            const previousStarter = currentLeg.startingPlayerId;
                            const previousStarterIndex = config.playerIds.indexOf(previousStarter);
                            const nextStarterIndex = (previousStarterIndex + 1) % config.playerIds.length;
                            const nextStarter = config.playerIds[nextStarterIndex];

                            newSets = [...newSets];
                            newSets[currentSetIndex] = { ...newSet, legWins: newLegWins };
                            newSets.push(createEmptySet(config.playerIds, config.startScore, nextStarter));
                            newPlayerIndex = nextStarterIndex;
                        }
                    } else {
                        // Start new leg within same set - alternate starter
                        newLegIndex++;
                        const previousStarter = currentLeg.startingPlayerId;
                        const previousStarterIndex = config.playerIds.indexOf(previousStarter);
                        const nextStarterIndex = (previousStarterIndex + 1) % config.playerIds.length;
                        const nextStarter = config.playerIds[nextStarterIndex];

                        newSet.legs = [...newSet.legs];
                        newSet.legs[currentLegIndex] = newLeg;
                        newSet.legs.push(createEmptyLeg(config.playerIds, config.startScore, nextStarter));
                        newSet.legWins = newLegWins;
                        newSets[currentSetIndex] = newSet;
                        newPlayerIndex = nextStarterIndex;
                    }
                } else {
                    // Just update the current leg
                    newSet.legs = [...newSet.legs];
                    newSet.legs[currentLegIndex] = newLeg;
                    newSets[currentSetIndex] = newSet;
                }

                set({
                    currentGame: {
                        ...currentGame,
                        currentPlayerIndex: newPlayerIndex,
                        currentSetIndex: newSetIndex,
                        currentLegIndex: newLegIndex,
                        sets: newSets,
                        setWins: newSetWins,
                        winner: gameWinner,
                        status: gameStatus,
                        finishedAt: gameStatus === 'finished' ? new Date().toISOString() : undefined,
                    },
                });

                // Don't auto-end game - let the winner screen display first
                // User will click "New Game" or "Back to Home" to end
            },

            recordScore: (score) => {
                // Create a pseudo-dart for quick score entry
                // Just record as single darts for simplicity
                const pseudoDart: Dart = {
                    segment: score,
                    multiplier: 1,
                    value: score,
                };

                const { currentGame } = get();
                if (!currentGame) return;

                const playerId = currentGame.config.playerIds[currentGame.currentPlayerIndex];
                const currentLeg = currentGame.sets[currentGame.currentSetIndex].legs[currentGame.currentLegIndex];
                const remaining = currentLeg.scores[playerId];

                // Check if this score would be valid
                const wouldBust = score > remaining || (currentGame.config.outMode === 'double' && remaining - score === 1);

                if (wouldBust) {
                    // Record as bust - score goes back to before throw
                    get().recordThrow([{ ...pseudoDart, value: remaining + 1 }]); // Force bust
                } else if (score === remaining && currentGame.config.outMode === 'double') {
                    // Checkout attempt with quick score - assume double finish
                    const doubleValue = score / 2;
                    const checkoutDart: Dart = {
                        segment: doubleValue <= 20 ? doubleValue : 25,
                        multiplier: 2,
                        value: score,
                    };
                    get().recordThrow([checkoutDart]);
                } else {
                    get().recordThrow([pseudoDart]);
                }
            },

            undo: () => {
                const { currentGame } = get();
                if (!currentGame) return;

                const { currentSetIndex, currentLegIndex, sets, config } = currentGame;
                const currentSet = sets[currentSetIndex];
                const currentLeg = currentSet.legs[currentLegIndex];

                if (currentLeg.history.length === 0) {
                    // Nothing to undo in current leg
                    // Could go back to previous leg, but for simplicity we don't
                    return;
                }

                // Remove last throw
                const lastThrow = currentLeg.history[currentLeg.history.length - 1];
                const newHistory = currentLeg.history.slice(0, -1);

                // Restore score
                const previousScore = lastThrow.isBust
                    ? lastThrow.remainingAfter
                    : lastThrow.remainingAfter + lastThrow.total;

                const newScores = { ...currentLeg.scores, [lastThrow.playerId]: previousScore };

                // Go back to previous player
                const previousPlayerIndex = config.playerIds.indexOf(lastThrow.playerId);

                const newLeg: LegState = {
                    ...currentLeg,
                    scores: newScores,
                    history: newHistory,
                    winner: undefined,
                };

                const newSets = [...sets];
                newSets[currentSetIndex] = {
                    ...currentSet,
                    legs: currentSet.legs.map((leg, i) =>
                        i === currentLegIndex ? newLeg : leg
                    ),
                };

                set({
                    currentGame: {
                        ...currentGame,
                        currentPlayerIndex: previousPlayerIndex,
                        sets: newSets,
                    },
                });
            },

            getCurrentPlayer: () => {
                const { currentGame } = get();
                if (!currentGame) return undefined;
                return currentGame.config.playerIds[currentGame.currentPlayerIndex];
            },

            getCurrentScore: (playerId) => {
                const { currentGame } = get();
                if (!currentGame) return 0;

                const currentLeg = currentGame.sets[currentGame.currentSetIndex].legs[currentGame.currentLegIndex];
                return currentLeg.scores[playerId] || 0;
            },

            getCheckoutSuggestion: (playerId) => {
                const { currentGame } = get();
                if (!currentGame) return null;

                const score = get().getCurrentScore(playerId);
                if (score > 170 || score < 2) return null;

                // Import checkout logic inline to avoid circular deps
                const { getCheckoutSuggestion } = require('../lib/darts/checkouts');
                const playerStore = usePlayerStore.getState();
                const player = playerStore.getPlayer(playerId);

                const suggestion = getCheckoutSuggestion(score, player?.preferredDouble);
                return suggestion?.darts || null;
            },
        }),
        {
            name: 'avyx-darts-game',
            partialize: (state) => ({
                gameHistory: state.gameHistory,
                // Don't persist currentGame - games are session-based
            }),
        }
    )
);
