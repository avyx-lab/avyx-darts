import { useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { PlayerCard } from '../../components/PlayerCard/PlayerCard';
import { Card, CardBody, Button, Input } from '@avyx/core';
import { Plus, Users } from 'lucide-react';
import './PlayersPage.css';

export function PlayersPage() {
    const { players, addPlayer, updatePlayer, deletePlayer } = usePlayerStore();
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');

    const handleAddPlayer = () => {
        if (newPlayerName.trim()) {
            addPlayer(newPlayerName.trim());
            setNewPlayerName('');
            setShowAddForm(false);
        }
    };

    return (
        <div className="page-content players-page">
            <div className="page-header">
                <div>
                    <h1>Players</h1>
                    <p className="page-description">Manage your players and their preferences.</p>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<Plus size={18} />}
                    onClick={() => setShowAddForm(true)}
                >
                    Add Player
                </Button>
            </div>

            {/* Add Player Form */}
            {showAddForm && (
                <Card className="add-player-card">
                    <CardBody>
                        <div className="add-player-form">
                            <Input
                                placeholder="Enter player name..."
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                                autoFocus
                            />
                            <div className="form-buttons">
                                <Button onClick={handleAddPlayer} disabled={!newPlayerName.trim()}>
                                    Add
                                </Button>
                                <Button variant="ghost" onClick={() => {
                                    setShowAddForm(false);
                                    setNewPlayerName('');
                                }}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Players List */}
            {players.length === 0 ? (
                <div className="empty-state">
                    <Users size={48} />
                    <h3>No players yet</h3>
                    <p>Add your first player to get started!</p>
                </div>
            ) : (
                <div className="players-list">
                    {players.map((player) => (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            onUpdate={(updates) => updatePlayer(player.id, updates)}
                            onDelete={() => deletePlayer(player.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
