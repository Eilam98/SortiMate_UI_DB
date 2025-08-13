// Deep Link Handler for SortiMate App
export class DeepLinkHandler {
  constructor() {
    this.isAppInstalled = false;
    this.init();
  }

  init() {
    // Check if we're in a mobile browser
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Try to detect if the app is installed
    this.detectApp();
  }

  detectApp() {
    if (!this.isMobile) return;

    // Try to open the app with a test URL
    const testUrl = 'sortimate://test';
    const fallbackUrl = window.location.href;
    
    // Create a hidden iframe to test app availability
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = testUrl;
    
    // Set a timeout to detect if the app opened
    const timeout = setTimeout(() => {
      // If we're still here after 2 seconds, app is probably not installed
      this.isAppInstalled = false;
      document.body.removeChild(iframe);
    }, 2000);

    // Listen for page visibility change (indicates app opened)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.isAppInstalled = true;
        clearTimeout(timeout);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.body.removeChild(iframe);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.body.appendChild(iframe);
  }

  openApp(url) {
    if (!this.isMobile) {
      // Desktop - just open the URL
      window.open(url, '_blank');
      return;
    }

    // Mobile - try to open app first, fallback to web
    const appUrl = url.replace('https://sortimate0.web.app', 'sortimate://');
    
    // Try to open the app
    window.location.href = appUrl;
    
    // Set a fallback timer
    setTimeout(() => {
      // If we're still here after 1 second, open in web browser
      if (!document.hidden) {
        window.location.href = url;
      }
    }, 1000);
  }

  handleBinDeepLink(binId) {
    const webUrl = `https://sortimate0.web.app/bin/${binId}`;
    const appUrl = `sortimate://bin/${binId}`;
    
    if (this.isMobile) {
      // Try app first, then web
      window.location.href = appUrl;
      setTimeout(() => {
        if (!document.hidden) {
          window.location.href = webUrl;
        }
      }, 1000);
    } else {
      // Desktop - just open web
      window.open(webUrl, '_blank');
    }
  }

  // Parse deep link URL
  parseDeepLink(url) {
    try {
      // Handle sortimate:// protocol
      if (url.startsWith('sortimate://')) {
        const path = url.replace('sortimate://', '');
        const parts = path.split('/');
        
        if (parts[0] === 'bin' && parts[1]) {
          return { type: 'bin', binId: parts[1] };
        }
      }
      
      // Handle https:// URLs
      if (url.includes('/bin/')) {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const binId = pathParts[pathParts.length - 1];
        
        if (binId && binId.startsWith('bin_')) {
          return { type: 'bin', binId };
        }
      }
    } catch (error) {
      console.error('Error parsing deep link:', error);
    }
    
    return null;
  }
}

// Create global instance
export const deepLinkHandler = new DeepLinkHandler(); 