/**
 * EdUTEND System - Configuration Switcher
 * 
 * @fileoverview Automatically switches between development and production configs
 * @author Code Crafters
 * @contributor Kay-M
 * @license MIT License - https://opensource.org/licenses/MIT
 * @copyright Copyright (c) 2025 Kay-M
 */

(function() {
    'use strict';
    
    // Determine environment
    const isProduction = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1' &&
                        !window.location.hostname.includes('localhost');
    
    // Load appropriate configuration
    function loadConfiguration() {
        if (isProduction) {
            console.log('🌐 Loading production configuration...');
            loadScript('js/config.production.js');
        } else {
            console.log('💻 Loading development configuration...');
            // Development config is already loaded via config.js
        }
    }
    
    // Dynamically load script
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Initialize configuration
    document.addEventListener('DOMContentLoaded', function() {
        if (isProduction) {
            loadConfiguration().then(() => {
                console.log('✅ Production configuration loaded');
                // Trigger any initialization that depends on config
                if (window.initializeApp) {
                    window.initializeApp();
                }
            }).catch(error => {
                console.error('❌ Failed to load production configuration:', error);
                console.log('🔄 Falling back to development configuration');
            });
        } else {
            console.log('✅ Development configuration ready');
        }
    });
    
    // Export environment info for debugging
    window.EDUTEND_ENV = {
        isProduction: isProduction,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        timestamp: new Date().toISOString()
    };
    
})();
