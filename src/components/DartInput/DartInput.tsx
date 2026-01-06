import { useState, useCallback, useEffect } from 'react';
import type { Dart, Multiplier } from '../../types/darts';
import { createDart, getSegmentName } from '../../lib/darts/scoring';
import './DartInput.css';

interface DartInputProps {
    onConfirm: (darts: Dart[]) => void;
    onUndo?: () => void;
    maxDarts?: number;
    onDartChange?: (darts: Dart[]) => void;
}

const SEGMENTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export function DartInput({ onConfirm, onUndo, maxDarts = 3, onDartChange }: DartInputProps) {
    const [currentDarts, setCurrentDarts] = useState<Dart[]>([]);
    const [multiplier, setMultiplier] = useState<Multiplier>(1);

    // Notify parent of dart changes
    useEffect(() => {
        onDartChange?.(currentDarts);
    }, [currentDarts, onDartChange]);

    const handleSegmentClick = useCallback((segment: number, mult?: Multiplier) => {
        if (currentDarts.length >= maxDarts) return;

        const finalMultiplier = mult ?? multiplier;
        // Bull can only be single (25) or double (50)
        const validMultiplier = segment === 25
            ? (finalMultiplier === 3 ? 2 : finalMultiplier)
            : finalMultiplier;

        const dart = createDart(segment, validMultiplier);
        setCurrentDarts((prev) => [...prev, dart]);
        setMultiplier(1); // Reset multiplier
    }, [currentDarts.length, maxDarts, multiplier]);

    const handleMiss = () => {
        if (currentDarts.length >= maxDarts) return;
        const dart: Dart = { segment: 0, multiplier: 1, value: 0 };
        setCurrentDarts((prev) => [...prev, dart]);
    };

    const handleRemoveLast = () => {
        setCurrentDarts((prev) => prev.slice(0, -1));
    };

    const handleConfirm = () => {
        if (currentDarts.length > 0) {
            onConfirm(currentDarts);
            setCurrentDarts([]);
            setMultiplier(1);
        }
    };

    const totalScore = currentDarts.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="dart-input">
            {/* Current Darts Display */}
            <div className="current-darts">
                <div className="darts-display">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className={`dart-slot ${currentDarts[i] ? 'filled' : ''}`}>
                            {currentDarts[i] ? (
                                <span>{getSegmentName(currentDarts[i].segment, currentDarts[i].multiplier)}</span>
                            ) : (
                                <span className="empty">-</span>
                            )}
                        </div>
                    ))}
                </div>
                <div className="total-display">
                    <span className="total-label">Total</span>
                    <span className="total-value">{totalScore}</span>
                </div>
            </div>

            {/* Multiplier Selection */}
            <div className="multiplier-row">
                <button
                    className={`mult-btn ${multiplier === 1 ? 'active' : ''}`}
                    onClick={() => setMultiplier(1)}
                >
                    Single
                </button>
                <button
                    className={`mult-btn ${multiplier === 2 ? 'active' : ''}`}
                    onClick={() => setMultiplier(2)}
                >
                    Double
                </button>
                <button
                    className={`mult-btn ${multiplier === 3 ? 'active' : ''}`}
                    onClick={() => setMultiplier(3)}
                >
                    Triple
                </button>
            </div>

            {/* Segment Grid */}
            <div className="segment-grid">
                {SEGMENTS.map((seg) => (
                    <button
                        key={seg}
                        className="segment-btn"
                        onClick={() => handleSegmentClick(seg)}
                        disabled={currentDarts.length >= maxDarts}
                    >
                        {seg}
                    </button>
                ))}
            </div>

            {/* Bull and Miss */}
            <div className="special-row">
                <button
                    className="special-btn bull"
                    onClick={() => handleSegmentClick(25, 1)}
                    disabled={currentDarts.length >= maxDarts}
                >
                    25
                </button>
                <button
                    className="special-btn bull-eye"
                    onClick={() => handleSegmentClick(25, 2)}
                    disabled={currentDarts.length >= maxDarts}
                >
                    Bull (50)
                </button>
                <button
                    className="special-btn miss"
                    onClick={handleMiss}
                    disabled={currentDarts.length >= maxDarts}
                >
                    Miss (0)
                </button>
            </div>

            {/* Actions */}
            <div className="action-row">
                <button
                    className="action-btn undo"
                    onClick={handleRemoveLast}
                    disabled={currentDarts.length === 0}
                >
                    ← Remove
                </button>
                {onUndo && (
                    <button className="action-btn undo-round" onClick={onUndo}>
                        ↩ Undo Round
                    </button>
                )}
                <button
                    className="action-btn confirm"
                    onClick={handleConfirm}
                    disabled={currentDarts.length === 0}
                >
                    Confirm ({currentDarts.length}/3)
                </button>
            </div>
        </div>
    );
}
