import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.avyx.darts',
    appName: 'Avyx Darts',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
