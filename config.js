// B2B Platform Configuration and Error Management
const CONFIG = {
    // Error Management Settings
    errorManagement: {
        enabled: true,
        logToConsole: true,
        logToScreen: true,
        logLevel: 'debug', // debug, info, warn, error
        maxErrors: 100,
        autoRetry: true,
        retryAttempts: 3,
        retryDelay: 1000
    },
    
    // API Settings
    api: {
        baseUrl: window.location.origin,
        timeout: 10000,
        retryOnFailure: true
    },
    
    // Development Settings
    development: {
        mockData: true,
        debugMode: true,
        verboseLogging: true
    },
    
    // Production Settings
    production: {
        mockData: false,
        debugMode: false,
        verboseLogging: false
    }
};

// Error Management System
class ErrorManager {
    constructor() {
        this.errors = [];
        this.config = CONFIG.errorManagement;
        this.init();
    }
    
    init() {
        if (!this.config.enabled) return;
        
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'JavaScript Error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'Unhandled Promise Rejection',
                message: event.reason?.message || event.reason,
                stack: event.reason?.stack
            });
        });
        
        // Network error handler
        this.setupNetworkErrorHandling();
    }
    
    handleError(error) {
        const errorObj = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            ...error,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.errors.push(errorObj);
        
        // Limit error storage
        if (this.errors.length > this.config.maxErrors) {
            this.errors.shift();
        }
        
        // Log to console
        if (this.config.logToConsole) {
            console.error('Error captured:', errorObj);
        }
        
        // Display on screen
        if (this.config.logToScreen) {
            this.displayError(errorObj);
        }
        
        // Auto retry if enabled
        if (this.config.autoRetry && error.retryable) {
            this.retryOperation(error);
        }
    }
    
    displayError(error) {
        const errorContainer = this.getOrCreateErrorContainer();
        const errorElement = document.createElement('div');
        errorElement.className = 'error-item bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2';
        errorElement.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <strong>${error.type}</strong>
                    <p class="text-sm">${error.message}</p>
                    <small class="text-xs text-gray-500">${error.timestamp}</small>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-red-500 hover:text-red-700">
                    ×
                </button>
            </div>
        `;
        errorContainer.appendChild(errorElement);
        
        // Auto remove after 10 seconds
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 10000);
    }
    
    getOrCreateErrorContainer() {
        let container = document.getElementById('error-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'error-container';
            container.className = 'fixed top-4 right-4 z-50 max-w-md';
            document.body.appendChild(container);
        }
        return container;
    }
    
    setupNetworkErrorHandling() {
        // Override fetch to handle network errors
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response;
            } catch (error) {
                this.handleError({
                    type: 'Network Error',
                    message: error.message,
                    url: args[0],
                    retryable: true
                });
                throw error;
            }
        };
    }
    
    retryOperation(error, attempt = 1) {
        if (attempt > this.config.retryAttempts) {
            this.handleError({
                type: 'Retry Failed',
                message: `Failed after ${this.config.retryAttempts} attempts: ${error.message}`
            });
            return;
        }
        
        setTimeout(() => {
            console.log(`Retrying operation (attempt ${attempt}/${this.config.retryAttempts})`);
            // Retry logic would go here
        }, this.config.retryDelay * attempt);
    }
    
    getErrors() {
        return this.errors;
    }
    
    clearErrors() {
        this.errors = [];
        const container = document.getElementById('error-container');
        if (container) {
            container.innerHTML = '';
        }
    }
    
    toggleErrorDisplay() {
        this.config.logToScreen = !this.config.logToScreen;
        if (!this.config.logToScreen) {
            const container = document.getElementById('error-container');
            if (container) {
                container.style.display = 'none';
            }
        }
    }
}

// Initialize error manager
const errorManager = new ErrorManager();

// Export for global use
window.ErrorManager = ErrorManager;
window.errorManager = errorManager;
window.CONFIG = CONFIG;

