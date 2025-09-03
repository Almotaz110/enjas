import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.eeec23b05346435e858d76c5bdc778a2',
  appName: 'task-quest-arabic-game',
  webDir: 'dist',
  server: {
    url: 'https://eeec23b0-5346-435e-858d-76c5bdc778a2.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
};

export default config;