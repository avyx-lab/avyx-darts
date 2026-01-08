import { useDartsSettingsStore } from '../../stores/settingsStore';
import { useTheme } from '@avyx/core';
import { Card, CardBody } from '@avyx/core';
import { Monitor, Moon, Sun, Target, LayoutGrid, Globe } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import './SettingsPage.css';

export function SettingsPage() {
    const isNative = Capacitor.isNativePlatform();
    const {
        inputMode, setInputMode,
        showDynamicCheckout, setShowDynamicCheckout,
        layoutMode, setLayoutMode,
        language, setLanguage
    } = useDartsSettingsStore();
    const { theme, setTheme } = useTheme();

    return (
        <div className="page-content settings-page">
            <h1>Settings</h1>
            <p className="page-description">Configure your Darts app preferences.</p>

            {/* System Settings */}
            <section className="settings-section">
                <h2><Monitor size={18} /> System Settings</h2>

                <Card>
                    <CardBody>
                        <div className="setting-row">
                            <div className="setting-info">
                                <h3>Theme</h3>
                                <p>Choose your preferred color scheme</p>
                            </div>
                            <div className="setting-options">
                                <button
                                    className={`option-btn ${theme === 'light' ? 'active' : ''}`}
                                    onClick={() => setTheme('light')}
                                >
                                    <Sun size={16} /> Light
                                </button>
                                <button
                                    className={`option-btn ${theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => setTheme('dark')}
                                >
                                    <Moon size={16} /> Dark
                                </button>
                                <button
                                    className={`option-btn ${theme === 'system' ? 'active' : ''}`}
                                    onClick={() => setTheme('system')}
                                >
                                    <Monitor size={16} /> System
                                </button>
                            </div>
                        </div>

                        <div className="setting-divider" />

                        <div className="setting-row">
                            <div className="setting-info">
                                <h3><Globe size={16} /> Language</h3>
                                <p>Choose your preferred language</p>
                            </div>
                            <div className="setting-options">
                                <button
                                    className={`option-btn ${language === 'en' ? 'active' : ''}`}
                                    onClick={() => setLanguage('en')}
                                >
                                    🇬🇧 English
                                </button>
                                <button
                                    className={`option-btn ${language === 'de' ? 'active' : ''}`}
                                    onClick={() => setLanguage('de')}
                                >
                                    🇩🇪 Deutsch
                                </button>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </section>

            {/* Game Settings */}
            <section className="settings-section">
                <h2><Target size={18} /> Game Settings</h2>

                <Card>
                    <CardBody>
                        <div className="setting-row">
                            <div className="setting-info">
                                <h3>Score Input Mode</h3>
                                <p>How do you want to enter your scores?</p>
                            </div>
                            <div className="setting-options">
                                <button
                                    className={`option-btn ${inputMode === 'round' ? 'active' : ''}`}
                                    onClick={() => setInputMode('round')}
                                >
                                    Round Total
                                </button>
                                <button
                                    className={`option-btn ${inputMode === 'dart' ? 'active' : ''}`}
                                    onClick={() => setInputMode('dart')}
                                >
                                    Per Dart
                                </button>
                            </div>
                        </div>

                        <div className="setting-divider" />

                        <div className="setting-row">
                            <div className="setting-info">
                                <h3>Dynamic Checkout</h3>
                                <p>Update checkout suggestion based on darts already thrown in the round</p>
                            </div>
                            <div className="setting-options">
                                <button
                                    className={`option-btn ${showDynamicCheckout ? 'active' : ''}`}
                                    onClick={() => setShowDynamicCheckout(true)}
                                >
                                    On
                                </button>
                                <button
                                    className={`option-btn ${!showDynamicCheckout ? 'active' : ''}`}
                                    onClick={() => setShowDynamicCheckout(false)}
                                >
                                    Off
                                </button>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </section>

            {/* Display Settings - Web Only */}
            {!isNative && (
                <section className="settings-section">
                    <h2><LayoutGrid size={18} /> Display Settings</h2>

                    <Card>
                        <CardBody>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <h3>Game Layout</h3>
                                    <p>Position of scoreboard and input panel</p>
                                </div>
                                <div className="setting-options">
                                    <button
                                        className={`option-btn ${layoutMode === 'auto' ? 'active' : ''}`}
                                        onClick={() => setLayoutMode('auto')}
                                    >
                                        Auto
                                    </button>
                                    <button
                                        className={`option-btn ${layoutMode === 'stacked' ? 'active' : ''}`}
                                        onClick={() => setLayoutMode('stacked')}
                                    >
                                        Stacked
                                    </button>
                                    <button
                                        className={`option-btn ${layoutMode === 'side-by-side' ? 'active' : ''}`}
                                        onClick={() => setLayoutMode('side-by-side')}
                                    >
                                        Side by Side
                                    </button>
                                </div>
                            </div>

                            <div className="setting-description">
                                <p><strong>Auto:</strong> Stacked on mobile/portrait, side-by-side on desktop/landscape.</p>
                                <p><strong>Stacked:</strong> Scoreboard above input (fits on one screen).</p>
                                <p><strong>Side by Side:</strong> Scoreboard and input next to each other.</p>
                            </div>
                        </CardBody>
                    </Card>
                </section>
            )}
        </div>
    );
}
