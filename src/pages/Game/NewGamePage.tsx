import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { useGameStore } from '../../stores/gameStore';
import { PlayerCard } from '../../components/PlayerCard/PlayerCard';
import { Card, CardBody, Button } from '@avyx/core';
import type { StartScore, InMode, OutMode, BotDifficulty, Player, PlayerType } from '../../types/darts';
import { Play, Users, Shuffle, Target, Search } from 'lucide-react';
import './NewGamePage.css';

const START_SCORES: StartScore[] = [301, 501, 701, 1001];

type StartingMethod = 'select' | 'bullout' | 'random';


export function NewGamePage() {
    const navigate = useNavigate();
    const players = usePlayerStore((s) => s.players);
    const startGame = useGameStore((s) => s.startGame);

    const [startScore, setStartScore] = useState<StartScore>(501);
    const [inMode, setInMode] = useState<InMode>('straight');
    const [outMode, setOutMode] = useState<OutMode>('double');
    const [legsToWin, setLegsToWin] = useState(3);
    const [setsToWin, setSetsToWin] = useState<number | undefined>(undefined);

    // Player Selection
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

    // Single Bot (not multiple)
    const [botSelected, setBotSelected] = useState(false);
    const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');


    const [playerSearch, setPlayerSearch] = useState('');

    const [startingMethod, setStartingMethod] = useState<StartingMethod>('select');
    const [startingPlayerId, setStartingPlayerId] = useState<string | undefined>();

    // The Bot player object
    const BOT_ID = 'bot';
    const botPlayer: Player = useMemo(() => ({
        id: BOT_ID,
        name: `Computer`,
        avatar: '🤖',
        preferredDouble: 20,
        createdAt: new Date().toISOString(),
        stats: { gamesPlayed: 0, gamesWon: 0, legsWon: 0, highestCheckout: 0, average: 0, checkoutPercentage: 0, total180s: 0 }
    }), []);

    // Combine real players only (not bot)
    const allAvailablePlayers = useMemo(() => {
        return [...players];
    }, [players]);

    const filteredPlayers = useMemo(() => {
        if (!playerSearch.trim()) return allAvailablePlayers;
        const search = playerSearch.toLowerCase();
        return allAvailablePlayers.filter(p => p.name.toLowerCase().includes(search));
    }, [allAvailablePlayers, playerSearch]);

    // Helper to get player by ID (including bot)
    const getPlayerById = (id: string): Player | undefined => {
        if (id === BOT_ID) {
            return {
                ...botPlayer,
                name: botSelected ? `Computer (${botDifficulty})` : 'Computer'
            };
        }
        return allAvailablePlayers.find(p => p.id === id);
    };

    const deselectBot = () => {
        setBotSelected(false);
        setSelectedPlayerIds(prev => prev.filter(id => id !== BOT_ID));
        if (startingPlayerId === BOT_ID) setStartingPlayerId(undefined);
    };

    const togglePlayer = (playerId: string) => {
        if (playerId === BOT_ID) {
            if (botSelected) {
                deselectBot();
            } else {
                setBotSelected(true);
                setSelectedPlayerIds(prev => [...prev, BOT_ID]);
            }
            return;
        }

        setSelectedPlayerIds((prev) => {
            const newSelection = prev.includes(playerId)
                ? prev.filter((id) => id !== playerId)
                : [...prev, playerId];

            if (newSelection.length === 1) {
                setStartingPlayerId(newSelection[0]);
            }
            if (!newSelection.includes(startingPlayerId || '')) {
                setStartingPlayerId(newSelection[0]);
            }

            return newSelection;
        });
    };

    const handleStartGame = () => {
        if (selectedPlayerIds.length < 1) return;

        let orderedPlayerIds = [...selectedPlayerIds];

        if (startingMethod === 'random') {
            orderedPlayerIds = orderedPlayerIds.sort(() => Math.random() - 0.5);
        } else if (startingMethod === 'select' && startingPlayerId) {
            orderedPlayerIds = orderedPlayerIds.filter(id => id !== startingPlayerId);
            orderedPlayerIds.unshift(startingPlayerId);
        } else if (startingMethod === 'bullout' && startingPlayerId) {
            orderedPlayerIds = orderedPlayerIds.filter(id => id !== startingPlayerId);
            orderedPlayerIds.unshift(startingPlayerId);
        }

        // Config maps
        const playerTypes: Record<string, PlayerType> = {};
        const finalBotDifficulties: Record<string, BotDifficulty> = {};

        orderedPlayerIds.forEach(id => {
            if (id === BOT_ID) {
                playerTypes[id] = 'computer';
                finalBotDifficulties[id] = botDifficulty;
            } else {
                playerTypes[id] = 'human';
            }
        });

        // Bot info is stored in gameConfig only, not in playerStore

        startGame({
            startScore,
            inMode,
            outMode,
            legsToWin,
            setsToWin,
            playerIds: orderedPlayerIds,
            playerTypes,
            botDifficulties: finalBotDifficulties
        });

        navigate('/game/active');
    };

    const handleBullOutResult = (playerId: string) => {
        setStartingPlayerId(playerId);
    };

    return (
        <div className="page-content new-game-page">
            <h1>New Game</h1>
            <p className="page-description">Configure your X01 game settings.</p>

            <div className="new-game-layout">
                {/* Left Column: Game Settings */}
                <div className="settings-column">
                    <section className="config-section">
                        <h2>Starting Score</h2>
                        <div className="option-grid">
                            {START_SCORES.map((score) => (
                                <button
                                    key={score}
                                    className={`option-btn ${startScore === score ? 'selected' : ''}`}
                                    onClick={() => setStartScore(score)}
                                >
                                    {score}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="config-section">
                        <h2>Start Mode</h2>
                        <div className="option-grid cols-2">
                            <button
                                className={`option-btn ${inMode === 'straight' ? 'selected' : ''}`}
                                onClick={() => setInMode('straight')}
                            >
                                Straight In
                            </button>
                            <button
                                className={`option-btn ${inMode === 'double' ? 'selected' : ''}`}
                                onClick={() => setInMode('double')}
                            >
                                Double In
                            </button>
                        </div>
                    </section>

                    <section className="config-section">
                        <h2>Finish Mode</h2>
                        <div className="option-grid cols-2">
                            <button
                                className={`option-btn ${outMode === 'double' ? 'selected' : ''}`}
                                onClick={() => setOutMode('double')}
                            >
                                Double Out
                            </button>
                            <button
                                className={`option-btn ${outMode === 'single' ? 'selected' : ''}`}
                                onClick={() => setOutMode('single')}
                            >
                                Single Out
                            </button>
                        </div>
                    </section>

                    <section className="config-section">
                        <h2>Format</h2>
                        <div className="format-selector">
                            <div className="format-item">
                                <label>First to</label>
                                <select
                                    value={legsToWin}
                                    onChange={(e) => setLegsToWin(parseInt(e.target.value))}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                                <span>Legs</span>
                            </div>

                            <div className="format-item">
                                <label>in</label>
                                <select
                                    value={setsToWin || 0}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setSetsToWin(val === 0 ? undefined : val);
                                    }}
                                >
                                    <option value={0}>No Sets</option>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                                <span>Sets</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Players and Who Starts */}
                <div className="players-column">
                    <section className="config-section">
                        <h2>Select Players</h2>
                        {allAvailablePlayers.length === 0 ? (
                            <Card>
                                <CardBody className="empty-players">
                                    <Users size={24} />
                                    <p>No players available. Add players first!</p>
                                    <Button onClick={() => navigate('/players')}>
                                        Add Players
                                    </Button>
                                </CardBody>
                            </Card>
                        ) : (
                            <>
                                {allAvailablePlayers.length >= 6 && (
                                    <div className="player-search">
                                        <Search size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search players..."
                                            value={playerSearch}
                                            onChange={(e) => setPlayerSearch(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="player-selection">
                                    {/* Real players */}
                                    {filteredPlayers.map((player) => (
                                        <PlayerCard
                                            key={player.id}
                                            player={player}
                                            selectable
                                            selected={selectedPlayerIds.includes(player.id)}
                                            onSelect={() => togglePlayer(player.id)}
                                        />
                                    ))}

                                    {/* Bot card - custom layout with inline difficulty selector */}
                                    <div
                                        className={`player-card selectable ${botSelected ? 'selected' : ''} bot-card`}
                                        onClick={() => {
                                            if (!botSelected) {
                                                setBotSelected(true);
                                                setSelectedPlayerIds(prev => [...prev, BOT_ID]);
                                            } else {
                                                deselectBot();
                                            }
                                        }}
                                    >
                                        <div className="player-avatar-large">{botPlayer.avatar}</div>

                                        <div className="player-details">
                                            <span className="player-name-large">Computer</span>
                                            <div className="difficulty-selector" onClick={(e) => e.stopPropagation()}>
                                                <label>Difficulty:</label>
                                                <select
                                                    value={botDifficulty}
                                                    onChange={(e) => {
                                                        setBotDifficulty(e.target.value as BotDifficulty);
                                                        if (!botSelected) {
                                                            setBotSelected(true);
                                                            setSelectedPlayerIds(prev => [...prev, BOT_ID]);
                                                        }
                                                    }}
                                                >
                                                    <option value="easy">🐣 Easy</option>
                                                    <option value="medium">🎯 Medium</option>
                                                    <option value="hard">🤖 Hard</option>
                                                    <option value="littler">🏆 Littler</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>

                    {selectedPlayerIds.length >= 2 && (
                        <section className="config-section">
                            <h2>Who Starts?</h2>
                            <div className="starting-method">
                                <div className="option-grid cols-3">
                                    <button
                                        className={`option-btn ${startingMethod === 'select' ? 'selected' : ''}`}
                                        onClick={() => setStartingMethod('select')}
                                    >
                                        <Users size={16} />
                                        Select
                                    </button>
                                    <button
                                        className={`option-btn ${startingMethod === 'bullout' ? 'selected' : ''}`}
                                        onClick={() => setStartingMethod('bullout')}
                                    >
                                        <Target size={16} />
                                        Bull Out
                                    </button>
                                    <button
                                        className={`option-btn ${startingMethod === 'random' ? 'selected' : ''}`}
                                        onClick={() => setStartingMethod('random')}
                                    >
                                        <Shuffle size={16} />
                                        Random
                                    </button>
                                </div>

                                {startingMethod === 'select' && (
                                    <div className="starting-player-select">
                                        <label>Starting Player:</label>
                                        <select
                                            value={startingPlayerId || ''}
                                            onChange={(e) => setStartingPlayerId(e.target.value)}
                                        >
                                            {selectedPlayerIds.map((id) => {
                                                const player = getPlayerById(id);
                                                return player ? (
                                                    <option key={id} value={id}>
                                                        {player.avatar} {player.name}
                                                    </option>
                                                ) : null;
                                            })}
                                        </select>
                                    </div>
                                )}

                                {startingMethod === 'bullout' && (
                                    <Card className="bullout-card">
                                        <CardBody>
                                            <h3>🎯 Bull Out</h3>
                                            <p>Each player throws one dart at the bull. Select who was closest:</p>
                                            <div className="bullout-players">
                                                {selectedPlayerIds.map((id) => {
                                                    const player = getPlayerById(id);
                                                    if (!player) return null;
                                                    return (
                                                        <button
                                                            key={id}
                                                            className={`bullout-btn ${startingPlayerId === id ? 'winner' : ''}`}
                                                            onClick={() => handleBullOutResult(id)}
                                                        >
                                                            <span className="bullout-avatar">{player.avatar}</span>
                                                            <span>{player.name}</span>
                                                            {startingPlayerId === id && <span className="winner-badge">✓ Closest</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </CardBody>
                                    </Card>
                                )}

                                {startingMethod === 'random' && (
                                    <p className="starting-hint">Starting player will be randomly selected.</p>
                                )}
                            </div>
                        </section>
                    )}

                    <div className="start-section">
                        <Button
                            variant="primary"
                            size="lg"
                            leftIcon={<Play size={20} />}
                            onClick={handleStartGame}
                            disabled={selectedPlayerIds.length < 1}
                        >
                            Start Game
                        </Button>
                        {selectedPlayerIds.length < 1 && (
                            <p className="hint">Select at least one player to start</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
