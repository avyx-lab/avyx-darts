import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, PlayerStats } from '../types/darts';

// ==========================================
// PLAYER STORE
// ==========================================

interface PlayerStore {
    players: Player[];

    // Actions
    addPlayer: (name: string, avatar?: string, preferredDouble?: number) => Player;
    updatePlayer: (id: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>) => void;
    deletePlayer: (id: string) => void;
    getPlayer: (id: string) => Player | undefined;
    updateStats: (id: string, stats: Partial<PlayerStats>) => void;
}

const createEmptyStats = (): PlayerStats => ({
    gamesPlayed: 0,
    gamesWon: 0,
    legsWon: 0,
    highestCheckout: 0,
    average: 0,
    checkoutPercentage: 0,
    total180s: 0,
});

const generateId = () => crypto.randomUUID();

const DEFAULT_AVATARS = ['🎯', '🏆', '⭐', '🔥', '💪', '🎮', '🎲', '👑'];

export const usePlayerStore = create<PlayerStore>()(
    persist(
        (set, get) => ({
            players: [],

            addPlayer: (name, avatar, preferredDouble = 16) => {
                const newPlayer: Player = {
                    id: generateId(),
                    name,
                    avatar: avatar || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
                    preferredDouble,
                    createdAt: new Date().toISOString(),
                    stats: createEmptyStats(),
                };

                set((state) => ({
                    players: [...state.players, newPlayer],
                }));

                return newPlayer;
            },

            updatePlayer: (id, updates) => {
                set((state) => ({
                    players: state.players.map((p) =>
                        p.id === id ? { ...p, ...updates } : p
                    ),
                }));
            },

            deletePlayer: (id) => {
                set((state) => ({
                    players: state.players.filter((p) => p.id !== id),
                }));
            },

            getPlayer: (id) => {
                return get().players.find((p) => p.id === id);
            },

            updateStats: (id, statUpdates) => {
                set((state) => ({
                    players: state.players.map((p) =>
                        p.id === id
                            ? { ...p, stats: { ...p.stats, ...statUpdates } }
                            : p
                    ),
                }));
            },
        }),
        {
            name: 'avyx-darts-players',
        }
    )
);
