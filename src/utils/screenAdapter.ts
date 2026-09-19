/**
 * Screen Adapter & Fullscreen Engine for Rocket League Sideswipe 2D
 * Handles responsive viewport adjustments, HiDPI scaling, cross-browser fullscreen,
 * screen orientation locks, and fallback immersive mode.
 */

export type ScreenMode = 'auto' | 'wide' | 'action';

export interface ScreenMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  dpr: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isUltraWide: boolean;
  isFullscreen: boolean;
}

class ScreenAdapterService {
  private wakeLock: any = null;
  private isImmersiveFallback = false;
  private listeners = new Set<(metrics: ScreenMetrics) => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      const handleEvent = () => this.notifyListeners();
      window.addEventListener('resize', handleEvent);
      window.addEventListener('orientationchange', handleEvent);
      document.addEventListener('fullscreenchange', handleEvent);
      document.addEventListener('webkitfullscreenchange' as any, handleEvent);
      document.addEventListener('mozfullscreenchange' as any, handleEvent);
      document.addEventListener('MSFullscreenChange' as any, handleEvent);

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleEvent);
      }
    }
  }

  public getMetrics(): ScreenMetrics {
    if (typeof window === 'undefined') {
      return {
        width: 1280,
        height: 720,
        aspectRatio: 16 / 9,
        dpr: 1,
        isPortrait: false,
        isLandscape: true,
        isMobile: false,
        isTablet: false,
        isUltraWide: false,
        isFullscreen: false,
      };
    }

    const width = window.visualViewport?.width || window.innerWidth;
    const height = window.visualViewport?.height || window.innerHeight;
    const aspectRatio = width / Math.max(1, height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    const isPortrait = height > width;
    const isLandscape = !isPortrait;
    const isMobile = Math.min(width, height) < 550 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const isTablet = !isMobile && Math.min(width, height) < 850;
    const isUltraWide = aspectRatio > 2.05;
    const isFullscreen = this.isNativeFullscreen() || this.isImmersiveFallback;

    return {
      width,
      height,
      aspectRatio,
      dpr,
      isPortrait,
      isLandscape,
      isMobile,
      isTablet,
      isUltraWide,
      isFullscreen,
    };
  }

  public isNativeFullscreen(): boolean {
    if (typeof document === 'undefined') return false;
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }

  public isFullscreen(): boolean {
    return this.isNativeFullscreen() || this.isImmersiveFallback;
  }

  public subscribe(cb: (metrics: ScreenMetrics) => void): () => void {
    this.listeners.add(cb);
    cb(this.getMetrics());
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notifyListeners() {
    const metrics = this.getMetrics();
    this.listeners.forEach((cb) => {
      try {
        cb(metrics);
      } catch (err) {
        console.error('ScreenAdapter listener error:', err);
      }
    });
  }

  /**
   * Request edge-to-edge fullscreen with landscape preference
   */
  public async requestFullscreen(targetElement?: HTMLElement | null): Promise<boolean> {
    const el = targetElement || document.documentElement;

    // 1. Try native Fullscreen API with vendor fallbacks
    let nativeSuccess = false;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: 'hide' } as any);
        nativeSuccess = true;
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
        nativeSuccess = true;
      } else if ((el as any).mozRequestFullScreen) {
        await (el as any).mozRequestFullScreen();
        nativeSuccess = true;
      } else if ((el as any).msRequestFullscreen) {
        await (el as any).msRequestFullscreen();
        nativeSuccess = true;
      }
    } catch {
      // Browsers or iframes with permissions restrictions might reject native fullscreen.
      // We gracefully fallback to immersive CSS mode below!
      nativeSuccess = false;
    }

    // 2. Lock screen orientation to landscape if available
    try {
      const orientation = screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation;
      if (orientation && orientation.lock) {
        await orientation.lock('landscape').catch(() => {});
      } else if ((screen as any).lockOrientation) {
        (screen as any).lockOrientation('landscape');
      }
    } catch {
      // Safe fallback
    }

    // 3. Acquire screen wake lock to keep screen on while playing
    try {
      if ('wakeLock' in navigator && !this.wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      }
    } catch {
      // Safe fallback
    }

    // 4. If native fullscreen succeeded or failed, set immersive fallback state accordingly
    this.isImmersiveFallback = !nativeSuccess;
    document.body.classList.toggle('app-immersive-mode', true);
    this.notifyListeners();
    return true;
  }

  /**
   * Exit fullscreen mode
   */
  public async exitFullscreen(): Promise<boolean> {
    try {
      if (this.isNativeFullscreen()) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch {
      // ignore
    }

    // Release orientation lock
    try {
      const orientation = screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation;
      if (orientation && orientation.unlock) {
        orientation.unlock();
      } else if ((screen as any).unlockOrientation) {
        (screen as any).unlockOrientation();
      }
    } catch {
      // ignore
    }

    // Release wake lock
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch {
        // ignore
      }
      this.wakeLock = null;
    }

    this.isImmersiveFallback = false;
    document.body.classList.toggle('app-immersive-mode', false);
    this.notifyListeners();
    return true;
  }

  /**
   * Toggle between fullscreen and windowed mode
   */
  public async toggleFullscreen(targetElement?: HTMLElement | null): Promise<boolean> {
    if (this.isFullscreen()) {
      return this.exitFullscreen();
    } else {
      return this.requestFullscreen(targetElement);
    }
  }
}

export const screenAdapter = new ScreenAdapterService();
