/**
 * EdUTEND System - QR Code Scanner Module
 * 
 * @fileoverview Handles QR code scanning and processing for student attendance
 * @author Code Crafters
 * @contributor Kay-M
 * @license MIT License - https://opensource.org/licenses/MIT
 * @copyright Copyright (c) 2025 Kay-M
 */

class QRScanner {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.isScanning = false;
        this.scanInterval = null;
        this.init();
    }

    init() {
        this.setupScannerElements();
        this.setupEventListeners();
    }

    setupScannerElements() {
        // Create video element for camera feed
        this.video = document.createElement('video');
        this.video.id = 'qr-scanner-video';
        this.video.style.width = '100%';
        this.video.style.height = '100%';
        this.video.style.objectFit = 'cover';

        // Create canvas for QR detection
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'qr-scanner-canvas';
        this.canvas.style.display = 'none';

        // Get canvas context
        this.context = this.canvas.getContext('2d');
    }

    setupEventListeners() {
        // Listen for QR code scan events
        document.addEventListener('qr:scanned', (event) => {
            this.handleQRScanned(event.detail);
        });
    }

    /**
     * Start QR code scanning
     */
    async startScanning() {
        try {
            if (this.isScanning) {
                console.log('Scanner already running');
                return;
            }

            // Get camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // Set up video element
            this.video.srcObject = stream;
            this.video.play();

            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = resolve;
            });

            // Set canvas dimensions to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            this.isScanning = true;
            this.startScanLoop();

            console.log('QR Scanner started successfully');

        } catch (error) {
            console.error('Failed to start QR scanner:', error);
            this.showError('Camera access denied or not available');
        }
    }

    /**
     * Stop QR code scanning
     */
    stopScanning() {
        if (!this.isScanning) return;

        this.isScanning = false;

        // Stop scan loop
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }

        // Stop camera stream
        if (this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }

        console.log('QR Scanner stopped');
    }

    /**
     * Start the scanning loop
     */
    startScanLoop() {
        this.scanInterval = setInterval(() => {
            if (!this.isScanning) return;

            // Draw current video frame to canvas
            this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // Get image data for QR detection
            const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

            // Use jsQR to detect QR codes
            if (typeof jsQR !== 'undefined') {
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    this.processQRCode(code.data);
                }
            }
        }, 100); // Check every 100ms
    }

    /**
     * Process scanned QR code data
     */
    processQRCode(qrData) {
        try {
            console.log('QR Code detected:', qrData);

            // Try to parse as JSON (our attendance QR format)
            let qrPayload;
            try {
                qrPayload = JSON.parse(qrData);
            } catch (e) {
                // If not JSON, treat as plain text
                qrPayload = { data: qrData };
            }

            // Check if it's an attendance QR code
            if (qrPayload.action === 'mark_attendance' && qrPayload.redirectUrl) {
                this.handleAttendanceQR(qrPayload);
            } else {
                // Handle other QR codes or plain text
                this.handleGenericQR(qrData);
            }

        } catch (error) {
            console.error('Error processing QR code:', error);
            this.showError('Invalid QR code format');
        }
    }

    /**
     * Handle attendance QR codes
     */
    handleAttendanceQR(qrPayload) {
        console.log('Processing attendance QR:', qrPayload);

        // Store QR data for attendance marking
        localStorage.setItem('scannedQRData', JSON.stringify(qrPayload));

        // Show success message
        this.showSuccess(`QR Code scanned successfully!<br>
            Course: ${qrPayload.courseCode}<br>
            Session: ${qrPayload.sessionId}<br>
            PIN: ${qrPayload.pin}`);

        // Stop scanning
        this.stopScanning();

        // Redirect to Student.html if specified
        if (qrPayload.redirectUrl) {
            setTimeout(() => {
                window.location.href = qrPayload.redirectUrl;
            }, 2000); // Wait 2 seconds to show the message
        }
    }

    /**
     * Handle generic QR codes
     */
    handleGenericQR(qrData) {
        console.log('Processing generic QR:', qrData);

        // Check if it's a URL
        if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
            this.showSuccess(`URL detected:<br>${qrData}<br><br>Opening in new tab...`);
            setTimeout(() => {
                window.open(qrData, '_blank');
            }, 2000);
        } else {
            this.showSuccess(`QR Code content:<br>${qrData}`);
        }

        // Stop scanning after processing
        setTimeout(() => {
            this.stopScanning();
        }, 3000);
    }

    /**
     * Handle QR scanned event from other sources
     */
    handleQRScanned(qrData) {
        this.processQRCode(qrData);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.qr-scanner-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `qr-scanner-notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 20px;
            border-radius: 12px;
            font-weight: 500;
            z-index: 10000;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            animation: fadeInScale 0.3s ease-out;
        `;

        notification.innerHTML = message;

        // Add CSS animation if not already present
        if (!document.querySelector('#qr-scanner-styles')) {
            const style = document.createElement('style');
            style.id = 'qr-scanner-styles';
            style.textContent = `
                @keyframes fadeInScale {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'fadeInScale 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    /**
     * Get scanner elements for UI integration
     */
    getScannerElements() {
        return {
            video: this.video,
            canvas: this.canvas
        };
    }

    /**
     * Check if scanner is running
     */
    isRunning() {
        return this.isScanning;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRScanner;
} else {
    window.QRScanner = QRScanner;
}


