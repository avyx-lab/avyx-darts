// ==========================================
// DARTS APP - TYPE DEFINITIONS
// ==========================================

// --- PLAYER ---
export interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    legsWon: number;
    highestCheckout: number;
    average: number;         // Overall 3-dart average
    checkoutPercentage: number;
    total180s: number;
}

export interface Player {
    id: string;
    name: string;
    avatar: string;          // Emoji for now
    preferredDouble: number; // 16, 20, 18, etc.
    createdAt: string;
    stats: PlayerStats;
}

// --- DART & THROW ---
export type Multiplier = 1 | 2 | 3;  // Single, Double, Triple

export interface Dart {
    segment: number;         // 1-20 or 25 (bull)
    multiplier: Multiplier;
    value: number;           // segment * multiplier (bull: 25 or 50)
}

export interface ThrowRound {
    playerId: string;
    darts: Dart[];           // 1-3 darts
    total: number;           // Sum of all darts
    remainingAfter: number;  // Score after this throw
    isCheckout: boolean;
    isBust: boolean;
    timestamp: string;
}

// --- GAME CONFIG ---
export type StartScore = 301 | 501 | 701 | 1001;
export type InMode = 'straight' | 'double';
export type OutMode = 'single' | 'double';
export type GameStatus = 'setup' | 'active' | 'finished';

export interface X01GameConfig {
    startScore: StartScore;
    inMode: InMode;
    outMode: OutMode;
    legsToWin: number;       // First to X legs
    setsToWin?: number;      // Optional: First to X sets
    playerIds: string[];
}

// --- GAME STATE ---
export interface LegState {
    scores: Record<string, number>;      // playerId -> current score
    hasStarted: Record<string, boolean>; // For double-in tracking
    history: ThrowRound[];
    winner?: string;
}

export interface SetState {
    legs: LegState[];
    legWins: Record<string, number>;
    winner?: string;
}

export interface X01GameState {
    id: string;
    config: X01GameConfig;
    status: GameStatus;

    // Current position
    currentPlayerIndex: number;
    currentSetIndex: number;
    currentLegIndex: number;

    // Game progress
    sets: SetState[];
    setWins: Record<string, number>;

    // Match result
    winner?: string;

    // Timestamps
    startedAt: string;
    finishedAt?: string;
}

// --- CHECKOUT ---
export interface CheckoutPath {
    score: number;
    darts: string[];  // e.g. ["T20", "T20", "D20"]
    preferredDouble?: number;
}

// --- GAME HISTORY ---
export interface GameSummary {
    id: string;
    gameType: 'x01';
    config: X01GameConfig;
    playerIds: string[];
    winnerId?: string;
    startedAt: string;
    finishedAt: string;
}
