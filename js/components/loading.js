/**
 * EdUTEND System - Loading Overlay Component
 * 
 * @fileoverview Provides a consistent loading experience across all dashboards
 * @author Code Crafters
 * @contributor Kay-M
 * @license MIT License - https://opensource.org/licenses/MIT
 * @copyright Copyright (c) 2025 Kay-M
 */

class LoadingOverlay {
    constructor() {
        this.overlay = null;
        this.spinner = null;
        this.message = null;
        this.isVisible = false;
        this.init();
    }

    init() {
        this.createOverlay();
        this.hide(); // Start hidden
    }

    createOverlay() {
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'loading-overlay';
        this.overlay.className = 'loading-overlay';
        
        // Create spinner
        this.spinner = document.createElement('div');
        this.spinner.className = 'loading-spinner';
        this.spinner.innerHTML = `
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
        `;
        
        // Create message container
        this.message = document.createElement('div');
        this.message.className = 'loading-message';
        this.message.textContent = 'Loading...';
        
        // Assemble overlay
        this.overlay.appendChild(this.spinner);
        this.overlay.appendChild(this.message);
        
        // Add to document
        document.body.appendChild(this.overlay);
        
        // Add CSS if not already present
        this.addStyles();
    }

    addStyles() {
        if (document.querySelector('#loading-overlay-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'loading-overlay-styles';
        style.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .loading-overlay.show {
                opacity: 1;
                visibility: visible;
            }
            
            .loading-spinner {
                position: relative;
                width: 80px;
                height: 80px;
                margin-bottom: 20px;
            }
            
            .spinner-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 4px solid transparent;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .spinner-ring:nth-child(2) {
                border-top-color: #e74c3c;
                animation-delay: 0.2s;
            }
            
            .spinner-ring:nth-child(3) {
                border-top-color: #f39c12;
                animation-delay: 0.4s;
            }
            
            .loading-message {
                color: white;
                font-size: 18px;
                font-weight: 500;
                text-align: center;
                max-width: 300px;
                line-height: 1.4;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Dark theme adjustments */
            .dark-theme .loading-overlay {
                background: rgba(0, 0, 0, 0.9);
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .loading-spinner {
                    width: 60px;
                    height: 60px;
                }
                
                .loading-message {
                    font-size: 16px;
                    max-width: 250px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    show(message = 'Loading...') {
        if (this.isVisible) return;
        
        this.message.textContent = message;
        this.overlay.classList.add('show');
        this.isVisible = true;
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
    }

    hide() {
        if (!this.isVisible) return;
        
        this.overlay.classList.remove('show');
        this.isVisible = false;
        
        // Restore body scrolling
        document.body.style.overflow = '';
    }

    updateMessage(message) {
        if (this.message) {
            this.message.textContent = message;
        }
    }

    showProgress(progress, message = 'Loading...') {
        this.show(message);
        
        // Update message with progress
        if (progress !== undefined) {
            this.message.textContent = `${message} (${Math.round(progress)}%)`;
        }
    }

    showSuccess(message = 'Success!', duration = 2000) {
        this.hide();
        
        // Show success message briefly
        this.message.textContent = message;
        this.message.style.color = '#27ae60';
        this.overlay.style.background = 'rgba(39, 174, 96, 0.9)';
        this.overlay.classList.add('show');
        
        setTimeout(() => {
            this.hide();
            this.message.style.color = 'white';
            this.overlay.style.background = 'rgba(0, 0, 0, 0.8)';
        }, duration);
    }

    showError(message = 'Error occurred', duration = 3000) {
        this.hide();
        
        // Show error message briefly
        this.message.textContent = message;
        this.message.style.color = '#e74c3c';
        this.overlay.style.background = 'rgba(231, 76, 60, 0.9)';
        this.overlay.classList.add('show');
        
        setTimeout(() => {
            this.hide();
            this.message.style.color = 'white';
            this.overlay.style.background = 'rgba(0, 0, 0, 0.8)';
        }, duration);
    }

    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.spinner = null;
        this.message = null;
    }
}

// Create global loading overlay instance
window.loadingOverlay = new LoadingOverlay();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingOverlay;
} else {
    window.LoadingOverlay = LoadingOverlay;
}
