import { KeepAwake } from '@capacitor-community/keep-awake';

export async function keepScreenOn() {
    try {
        await KeepAwake.keepAwake();
        console.log('Screen Wake Lock active');
    } catch (err) {
        console.warn('KeepAwake not supported or failed:', err);
    }
}

export async function allowScreenOff() {
    try {
        await KeepAwake.allowSleep();
        console.log('Screen Wake Lock released');
    } catch (err) {
        console.warn('KeepAwake failed to release:', err);
    }
}
