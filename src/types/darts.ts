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
    scoreAtStart: number;    // Score before this throw
    isCheckout: boolean;
    isBust: boolean;
    timestamp: string;
}

// --- GAME CONFIG ---
export type StartScore = 301 | 501 | 701 | 1001;
export type InMode = 'straight' | 'double';
export type OutMode = 'single' | 'double';
export type GameStatus = 'setup' | 'active' | 'finished';

// Bot Types
export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'littler';
export type PlayerType = 'human' | 'computer';

export interface X01GameConfig {
    startScore: StartScore;
    inMode: InMode;
    outMode: OutMode;
    legsToWin: number;
    setsToWin?: number;
    playerIds: string[];
    // Bot configurations
    playerTypes?: Record<string, PlayerType>; // playerId -> type
    botDifficulties?: Record<string, BotDifficulty>; // playerId -> difficulty (if computer)
}

// --- GAME STATE ---
export interface LegState {
    scores: Record<string, number>;      // playerId -> current score
    hasStarted: Record<string, boolean>; // For double-in tracking
    history: ThrowRound[];
    winner?: string;
    startingPlayerId: string; // Who started this leg
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
export interface GamePlayerStats {
    average: number;           // 3-dart average for this game
    checkout: number | null;   // Highest checkout (if any)
    total180s: number;         // 180s scored in this game
    total140Plus: number;      // 140-179 scored
    total120Plus: number;      // 120-139 scored
    total100Plus: number;      // 100-119 scored
    highestCheckout: number;   // Highest checkout value
    checkoutQuote: number;     // Checkout percentage (0-100)
    legsWon: number;
    setsWon: number;
    totalPoints: number;       // Total points scored
    dartsThrown: number;       // Total darts thrown
}

export interface GameSummary {
    id: string;
    gameType: 'x01';
    config: X01GameConfig;
    playerIds: string[];
    winnerId?: string;
    startedAt: string;
    finishedAt: string;
    // Detailed stats per player for this game
    playerStats?: Record<string, GamePlayerStats>;
    // All throw rounds for detailed history replay
    rounds?: ThrowRound[];
    // Explicit leg structure for history
    legs?: {
        winner?: string;
        rounds: ThrowRound[];
    }[];
}
