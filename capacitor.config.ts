import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.ecototally.app',
  appName: 'EcoTotally',
  webDir: 'dist/ectotally/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;