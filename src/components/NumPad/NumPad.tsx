import { useState } from 'react';
import { QUICK_SCORES } from '../../lib/darts/scoring';
import { Delete } from 'lucide-react';
import './NumPad.css';

interface NumPadProps {
    onScore: (score: number) => void;
    onUndo?: () => void;
    maxScore?: number;
    disabled?: boolean;
}

export function NumPad({ onScore, onUndo, maxScore = 180, disabled = false }: NumPadProps) {
    const [input, setInput] = useState('');

    const handleNumberClick = (num: number) => {
        const newInput = input + num.toString();
        const value = parseInt(newInput, 10);

        if (value <= maxScore) {
            setInput(newInput);
        }
    };

    const handleConfirm = () => {
        if (input) {
            const score = parseInt(input, 10);
            if (score >= 0 && score <= maxScore) {
                onScore(score);
                setInput('');
            }
        }
    };

    const handleClear = () => {
        setInput('');
    };

    const handleBackspace = () => {
        setInput((prev) => prev.slice(0, -1));
    };

    const handleQuickScore = (score: number) => {
        onScore(score);
        setInput('');
    };

    return (
        <div className={`numpad ${disabled ? 'disabled' : ''}`}>
            {/* Input Display */}
            <div className="numpad-display">
                <span className="numpad-value">{input || '0'}</span>
                <button className="backspace-btn" onClick={handleBackspace} disabled={disabled}>
                    <Delete size={20} />
                </button>
            </div>

            {/* Quick Scores */}
            <div className="quick-scores">
                {QUICK_SCORES.map((score) => (
                    <button
                        key={score}
                        className="quick-score-btn"
                        onClick={() => handleQuickScore(score)}
                        disabled={disabled}
                    >
                        {score}
                    </button>
                ))}
            </div>

            {/* Number Pad */}
            <div className="numpad-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        className="numpad-btn"
                        data-key={num.toString()}
                        onClick={() => handleNumberClick(num)}
                        disabled={disabled}
                    >
                        {num}
                    </button>
                ))}

                {onUndo && (
                    <button className="numpad-btn undo-btn" onClick={onUndo} disabled={disabled}>
                        ↺
                    </button>
                )}

                <button
                    className="numpad-btn"
                    data-key="0"
                    onClick={() => handleNumberClick(0)}
                    disabled={disabled}
                >
                    0
                </button>

                <button
                    className="numpad-btn clear-btn"
                    onClick={handleClear}
                    disabled={disabled}
                >
                    C
                </button>
            </div>

            {/* Confirm Button */}
            <button
                className="confirm-btn"
                onClick={handleConfirm}
                disabled={!input || disabled}
            >
                Confirm
            </button>
        </div>
    );
}
