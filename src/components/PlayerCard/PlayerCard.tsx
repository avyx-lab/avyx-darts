import { useState } from 'react';
import type { Player } from '../../types/darts';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import './PlayerCard.css';

interface PlayerCardProps {
    player: Player;
    onUpdate?: (updates: Partial<Player>) => void;
    onDelete?: () => void;
    selectable?: boolean;
    selected?: boolean;
    onSelect?: () => void;
}

const AVATARS = ['🎯', '🏆', '⭐', '🔥', '💪', '🎮', '🎲', '👑', '⚡', '🎪'];
const DOUBLES = [20, 16, 18, 8, 12, 10, 4, 6, 2, 14];

export function PlayerCard({
    player,
    onUpdate,
    onDelete,
    selectable = false,
    selected = false,
    onSelect,
}: PlayerCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(player.name);
    const [avatar, setAvatar] = useState(player.avatar);
    const [preferredDouble, setPreferredDouble] = useState(player.preferredDouble);

    const handleSave = () => {
        if (onUpdate && name.trim()) {
            onUpdate({ name: name.trim(), avatar, preferredDouble });
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setName(player.name);
        setAvatar(player.avatar);
        setPreferredDouble(player.preferredDouble);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="player-card editing">
                <div className="edit-form">
                    <div className="form-row">
                        <label>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Player name"
                        />
                    </div>

                    <div className="form-row">
                        <label>Avatar</label>
                        <div className="avatar-picker">
                            {AVATARS.map((a) => (
                                <button
                                    key={a}
                                    className={`avatar-option ${avatar === a ? 'selected' : ''}`}
                                    onClick={() => setAvatar(a)}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <label>Preferred Double</label>
                        <div className="double-picker">
                            {DOUBLES.map((d) => (
                                <button
                                    key={d}
                                    className={`double-option ${preferredDouble === d ? 'selected' : ''}`}
                                    onClick={() => setPreferredDouble(d)}
                                >
                                    D{d}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button className="save-btn" onClick={handleSave}>
                            <Check size={16} /> Save
                        </button>
                        <button className="cancel-btn" onClick={handleCancel}>
                            <X size={16} /> Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`player-card ${selectable ? 'selectable' : ''} ${selected ? 'selected' : ''}`}
            onClick={selectable ? onSelect : undefined}
        >
            <div className="player-avatar-large">{player.avatar}</div>

            <div className="player-details">
                <span className="player-name-large">{player.name}</span>
                <span className="player-double">Preferred: D{player.preferredDouble}</span>
            </div>

            <div className="player-stats-mini">
                <span>{player.stats.gamesWon}/{player.stats.gamesPlayed} wins</span>
                <span>Avg: {player.stats.average.toFixed(1)}</span>
            </div>

            {(onUpdate || onDelete) && !selectable && (
                <div className="player-actions">
                    {onUpdate && (
                        <button className="edit-btn" onClick={() => setIsEditing(true)}>
                            <Edit2 size={16} />
                        </button>
                    )}
                    {onDelete && (
                        <button className="delete-btn" onClick={onDelete}>
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )}

            {selectable && selected && (
                <div className="selected-indicator">
                    <Check size={20} />
                </div>
            )}
        </div>
    );
}
