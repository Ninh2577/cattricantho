// Core Platform JS
import { siteConfig } from '../../config/site.config.js';
import { trackingConfig } from '../../config/tracking.config.js';

class CorePlatform {
  constructor() {
    this.initFeatures();
    if (trackingConfig.events.trackScrollDepth) {
      this.initScrollTracking();
    }
  }

  initFeatures() {
    if (siteConfig.features.enableAnalytics) {
      console.log('Analytics initialized.');
    }
    
    // Initialize UI scripts on DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initUI());
    } else {
      this.initUI();
    }
  }
  
  initUI() {
    this.initMobileMenu();
    this.initFAQ();
    this.initStickyHeader();
    this.initTOC();
  }

  initMobileMenu() {
    const menuToggle = document.querySelector('.skmd-menu-toggle');
    const offcanvas = document.querySelector('.skmd-offcanvas');
    const closeButtons = document.querySelectorAll('[data-action="close-menu"]');
    
    if (!menuToggle || !offcanvas) return;
    
    // Accessibility: Focus trap elements
    const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
    let firstFocusableElement;
    let lastFocusableElement;
    
    const updateFocusableElements = () => {
      const focusableElements = offcanvas.querySelectorAll(focusableElementsString);
      if (focusableElements.length > 0) {
        firstFocusableElement = focusableElements[0];
        lastFocusableElement = focusableElements[focusableElements.length - 1];
      }
    };
    
    const openMenu = () => {
      menuToggle.setAttribute('aria-expanded', 'true');
      offcanvas.classList.add('is-active');
      offcanvas.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // Prevent body scroll
      updateFocusableElements();
      
      // Focus first element inside menu if possible
      if (firstFocusableElement) {
        setTimeout(() => firstFocusableElement.focus(), 100);
      }
    };
    
    const closeMenu = () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      offcanvas.classList.remove('is-active');
      offcanvas.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      
      // Restore focus to toggle button
      menuToggle.focus();
    };

    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    closeButtons.forEach(btn => {
      btn.addEventListener('click', closeMenu);
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && offcanvas.classList.contains('is-active')) {
        closeMenu();
      }
    });
    
    // Focus Trap
    offcanvas.addEventListener('keydown', (e) => {
      const isTabPressed = e.key === 'Tab' || e.keyCode === 9;
      if (!isTabPressed || !firstFocusableElement) return;

      if (e.shiftKey) { // if shift + tab
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else { // if tab
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    });
  }
  
  initFAQ() {
    const faqHeaders = document.querySelectorAll('.skmd-faq-item__header');
    faqHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        const isOpen = item.classList.contains('is-open');

        if (!isOpen) {
          item.classList.add('is-open');
          header.setAttribute('aria-expanded', 'true');
        } else {
          item.classList.remove('is-open');
          header.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Keyboard support for FAQ
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });
  }
  
  initStickyHeader() {
    const header = document.querySelector('.skmd-header');
    if (header) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
          header.style.boxShadow = 'var(--shadow-md)';
        } else {
          header.style.boxShadow = 'var(--shadow-sm)';
        }
      }, { passive: true });
    }
  }
  
  initTOC() {
    const content = document.getElementById("skmd-content-html");
    const tocContainer = document.getElementById("skmd-dynamic-toc");
    
    if (!content || !tocContainer) return;
    
    const headings = content.querySelectorAll("h2, h3");
    const tocLinks = tocContainer.querySelectorAll("a");
    if (headings.length === 0 || tocLinks.length === 0) return;
    
    const scrollspyTargets = Array.from(headings);
    
    // Smooth scroll with reduced motion support
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    tocLinks.forEach(link => {
      link.addEventListener("click", function(e) {
        e.preventDefault();
        const href = this.getAttribute("href");
        if (!href || !href.startsWith('#')) return;
        
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          const targetOffset = targetElement.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ 
            top: targetOffset, 
            behavior: prefersReducedMotion ? 'auto' : 'smooth' 
          });
        }
      });
    });
    
    // Scrollspy
    window.addEventListener("scroll", function() {
      const scrollPosition = window.scrollY + 120;
      let currentHeading = null;
      
      scrollspyTargets.forEach((heading) => {
        if (heading.offsetTop <= scrollPosition) {
          currentHeading = heading;
        }
      });
      
      tocLinks.forEach(link => {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      });
      
      if (currentHeading) {
        const activeLink = tocContainer.querySelector(`a[href="#${currentHeading.id}"]`);
        if (activeLink) {
          activeLink.classList.add("active");
          activeLink.setAttribute("aria-current", "location");
        }
      }
    }, { passive: true });
  }

  initScrollTracking() {
    // Scroll depth logic
  }
}

export default new CorePlatform();
