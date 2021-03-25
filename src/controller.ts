import { Capacitor, PluginListenerHandle, Plugins } from '@capacitor/core';
import { SafeAreaInsets, SafeAreaInsetsChangedCallback } from './definitions';

class SafeAreaController {
  private callback: PluginListenerHandle | undefined;
  private insets: SafeAreaInsets = {
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
  };
  private listeners: SafeAreaInsetsChangedCallback[];

  constructor() {
    this.callback = undefined;
    this.listeners = [];
  }

  load(): void {
    this.callback?.remove();

    this.callback = Plugins.SafeAreaPlugin.addListener(
      'safeAreaPluginsInsetChange',
      (insets: SafeAreaInsets) => {
        this.updateInsets(insets);
        this.injectCSSVariables();
        this.notifyListeners();
      },
    );

    this.refresh();
  }

  addListener(listener: SafeAreaInsetsChangedCallback): void {
    this.listeners.push(listener);
  }

  removeListener(listener: SafeAreaInsetsChangedCallback): void {
    const index = this.listeners.indexOf(listener);

    if (index >= 0) delete this.listeners[index];
  }

  removeAllListeners(): void {
    this.listeners.length = 0;
  }

  private injectCSSVariables(): void {
    for (const inset in this.insets) {
      switch (Capacitor.getPlatform()) {
        case 'android':
        case 'ios':
          {
            document.documentElement.style.setProperty(
              `--${Capacitor.getPlatform()}-safe-area-inset-${inset}`,
              `${this.insets[inset]}px`,
            );
            document.documentElement.style.setProperty(
              `--safe-area-inset-${inset}`,
              `max(var(--${Capacitor.getPlatform()}-safe-area-inset-${inset}, '0px'), env(safe-area-inset-${inset}))`,
            );
          }
          break;
        default:
          {
            document.documentElement.style.setProperty(
              `--safe-area-inset-${inset}`,
              '0px',
            );
          }
          break;
      }
    }
  }

  async refresh(): Promise<void> {
    const { insets } = await Plugins.SafeAreaPlugin.getSafeAreaInsets();

    this.updateInsets(insets);

    this.injectCSSVariables();
    this.notifyListeners();
  }

  getInsets(): SafeAreaInsets {
    return this.insets;
  }

  unload(): void {
    this.callback?.remove();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.insets));
  }

  private updateInsets(insets: SafeAreaInsets): void {
    this.insets = insets;
  }
}

export default SafeAreaController;
