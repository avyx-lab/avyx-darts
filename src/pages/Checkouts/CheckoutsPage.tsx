import { useState } from 'react';
import { getFullCheckoutTable } from '../../lib/darts/checkouts';
import { Card, CardBody } from '@avyx/core';
import './CheckoutsPage.css';

export function CheckoutsPage() {
    const [filter, setFilter] = useState<'all' | '2-dart' | '3-dart'>('all');
    const checkoutTable = getFullCheckoutTable();

    const filteredTable = checkoutTable.filter((entry) => {
        if (filter === 'all') return true;
        if (filter === '2-dart') return entry.darts.length <= 2;
        if (filter === '3-dart') return entry.darts.length === 3;
        return true;
    });

    return (
        <div className="page-content checkouts-page">
            <h1>Checkout Table</h1>
            <p className="page-description">
                Quick reference for all possible checkouts from 2 to 170.
            </p>

            <div className="filter-row">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-btn ${filter === '2-dart' ? 'active' : ''}`}
                    onClick={() => setFilter('2-dart')}
                >
                    2-Dart
                </button>
                <button
                    className={`filter-btn ${filter === '3-dart' ? 'active' : ''}`}
                    onClick={() => setFilter('3-dart')}
                >
                    3-Dart
                </button>
            </div>

            <Card>
                <CardBody>
                    <div className="checkout-table">
                        <div className="checkout-header">
                            <span>Score</span>
                            <span>Checkout</span>
                        </div>
                        <div className="checkout-list">
                            {filteredTable.map((entry) => (
                                <div key={entry.score} className="checkout-row">
                                    <span className="checkout-score">{entry.score}</span>
                                    <span className="checkout-darts">{entry.darts.join(' → ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
