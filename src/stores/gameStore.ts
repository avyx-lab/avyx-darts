import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    X01GameState,
    X01GameConfig,
    ThrowRound,
    Dart,
    LegState,
    SetState,
    GameSummary,
    GamePlayerStats
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
    clearHistory: () => void;

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

                // Calculate detailed player stats from game history
                const playerStats: Record<string, GamePlayerStats> = {};

                currentGame.config.playerIds.forEach((playerId) => {
                    let totalPoints = 0;
                    let dartsThrown = 0;
                    let total180s = 0;
                    let total140Plus = 0;
                    let total120Plus = 0;
                    let total100Plus = 0;
                    let highestCheckout = 0;
                    let checkoutAttempts = 0;
                    let checkoutHits = 0;
                    let legsWon = 0;
                    let setsWon = currentGame.setWins[playerId] || 0;

                    // Iterate through all sets and legs
                    currentGame.sets.forEach((setData) => {
                        legsWon += setData.legWins[playerId] || 0;

                        setData.legs.forEach((leg) => {
                            leg.history
                                .filter((round) => round.playerId === playerId)
                                .forEach((round) => {
                                    totalPoints += round.total;
                                    dartsThrown += round.darts.length;

                                    // Check specific scores
                                    if (round.total === 180) total180s++;
                                    else if (round.total >= 140) total140Plus++;
                                    else if (round.total >= 120) total120Plus++;
                                    else if (round.total >= 100) total100Plus++;

                                    // Check for checkout
                                    if (round.isCheckout && round.total > 0) {
                                        if (round.total > highestCheckout) {
                                            highestCheckout = round.total;
                                        }
                                    }

                                    // Checkout stats
                                    if (round.scoreAtStart <= 170) {
                                        checkoutAttempts++;
                                        if (round.isCheckout) checkoutHits++;
                                    }
                                });
                        });
                    });

                    // Calculate 3-dart average
                    const average = dartsThrown > 0 ? (totalPoints / dartsThrown) * 3 : 0;
                    const checkoutQuote = checkoutAttempts > 0 ? (checkoutHits / checkoutAttempts) * 100 : 0;

                    playerStats[playerId] = {
                        average: Math.round(average * 100) / 100,
                        checkout: highestCheckout === 0 ? null : highestCheckout,
                        highestCheckout: highestCheckout,
                        checkoutQuote: Math.round(checkoutQuote * 10) / 10,
                        total180s,
                        total140Plus,
                        total120Plus,
                        total100Plus,
                        legsWon,
                        setsWon,
                        totalPoints,
                        dartsThrown,
                    };
                });

                // Collect all rounds from all sets and legs
                const allRounds: ThrowRound[] = [];
                const summaryLegs: { winner?: string; rounds: ThrowRound[] }[] = [];

                currentGame.sets.forEach((setData) => {
                    setData.legs.forEach((leg) => {
                        allRounds.push(...leg.history);
                        summaryLegs.push({
                            winner: leg.winner,
                            rounds: [...leg.history]
                        });
                    });
                });

                // Save to history with detailed stats
                const summary: GameSummary = {
                    id: currentGame.id,
                    gameType: 'x01',
                    config: currentGame.config,
                    playerIds: currentGame.config.playerIds,
                    winnerId: currentGame.winner,
                    startedAt: currentGame.startedAt,
                    finishedAt: new Date().toISOString(),
                    playerStats,
                    rounds: allRounds,
                    legs: summaryLegs,
                };

                // Update player lifetime stats
                const playerStore = usePlayerStore.getState();
                currentGame.config.playerIds.forEach((playerId) => {
                    const player = playerStore.getPlayer(playerId);
                    if (player) {
                        const gameStats = playerStats[playerId];
                        const newGamesPlayed = player.stats.gamesPlayed + 1;
                        const newGamesWon = player.stats.gamesWon + (playerId === currentGame.winner ? 1 : 0);
                        const newLegsWon = player.stats.legsWon + gameStats.legsWon;
                        const newTotal180s = player.stats.total180s + gameStats.total180s;

                        // Update highest checkout
                        const newHighestCheckout = gameStats.checkout !== null
                            ? Math.max(player.stats.highestCheckout, gameStats.checkout)
                            : player.stats.highestCheckout;

                        // Calculate new lifetime average (weighted)
                        // Simple approach: just use the latest game's impact
                        const oldWeight = player.stats.gamesPlayed;
                        const newAverage = oldWeight > 0
                            ? ((player.stats.average * oldWeight) + gameStats.average) / (oldWeight + 1)
                            : gameStats.average;

                        playerStore.updateStats(playerId, {
                            gamesPlayed: newGamesPlayed,
                            gamesWon: newGamesWon,
                            legsWon: newLegsWon,
                            total180s: newTotal180s,
                            highestCheckout: newHighestCheckout,
                            average: Math.round(newAverage * 100) / 100,
                        });
                    }
                });

                set((state) => ({
                    currentGame: null,
                    gameHistory: [summary, ...state.gameHistory],
                }));
            },

            abandonGame: () => {
                set({ currentGame: null });
            },

            clearHistory: () => {
                set({ gameHistory: [] });
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
                currentGame: state.currentGame, // Persist active game to survive app restart
            }),
        }
    )
);
