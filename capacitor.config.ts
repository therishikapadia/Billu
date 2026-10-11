import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.billu.billing',
  appName: 'Billu',
  webDir: 'out',
  server: {
    // Point this to your deployed Vercel domain:
    url: 'https://billu-lyart.vercel.app/',
    cleartext: false,
    androidScheme: 'https'
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
