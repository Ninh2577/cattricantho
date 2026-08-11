import { trackingConfig } from '../config/tracking.config.js';

export class TrackingService {
  static init() {
    this.injectGA4();
    this.injectFBPixel();
    if (trackingConfig.events.trackCtaClicks) {
      this.attachCTAEventListeners();
    }
  }

  static injectGA4() {
    if (!trackingConfig.ga4Id) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingConfig.ga4Id}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', trackingConfig.ga4Id);
  }

  static injectFBPixel() {
    // Standard FB Pixel boilerplate using trackingConfig.fbPixelId
  }

  static attachCTAEventListeners() {
    document.querySelectorAll('.btn-hotline, .btn-zalo, .btn-primary').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ctaType = e.target.classList.contains('btn-hotline') ? 'hotline' : 
                        e.target.classList.contains('btn-zalo') ? 'zalo' : 'booking';
        
        if (window.gtag) {
          window.gtag('event', 'cta_click', {
            'event_category': 'Engagement',
            'event_label': ctaType
          });
        }
      });
    });
  }
}
