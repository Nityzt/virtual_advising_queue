/**
 * CLIENT: src/config/api.js
 * Smart API URL configuration that works for both development and production
 * without needing to manually change environment variables
 */

class ApiConfig {
    constructor() {
        this.localUrl = 'http://localhost:5001';
        this.prodUrl = 'https://virtual-advising-queue.onrender.com';
        this.baseUrl = this.determineBaseUrl();
        this.isHealthy = false;
    }

    determineBaseUrl() {
        // 1. Check if environment variable is explicitly set
        if (process.env.REACT_APP_API_URL) {
            return process.env.REACT_APP_API_URL;
        }

        // 2. Auto-detect based on current environment and hostname
        const hostname = window.location.hostname;

        // If we're running locally, try local first
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return this.localUrl;
        }

        // Otherwise use production
        return this.prodUrl;
    }

    async testConnection(url, timeout = 3000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(`${url}/api/health`, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.log(`Connection test failed for ${url}:`, error.message);
            return false;
        }
    }

    async initialize() {
        // If we determined local URL, test if it's actually available
        if (this.baseUrl === this.localUrl) {
            const isLocalHealthy = await this.testConnection(this.localUrl, 2000);

            if (!isLocalHealthy) {
                console.log('Local server not available, falling back to production');
                this.baseUrl = this.prodUrl;
            }
        }

        // Test the final URL
        this.isHealthy = await this.testConnection(this.baseUrl, 5000);

        if (!this.isHealthy) {
            console.warn(`API server at ${this.baseUrl} is not responding`);
        }

        return this.baseUrl;
    }

    getUrl() {
        return this.baseUrl;
    }

    isServerHealthy() {
        return this.isHealthy;
    }
}

// Create singleton instance
const apiConfig = new ApiConfig();

// Export the URL (will be determined synchronously)
export const API_BASE_URL = apiConfig.getUrl();

// Export async initializer for components that need to ensure connectivity
export const initializeApi = () => apiConfig.initialize();

// Export health check
export const isApiHealthy = () => apiConfig.isServerHealthy();

// Debug logging
console.log('API Configuration:', {
    environment: process.env.NODE_ENV,
    hostname: window.location.hostname,
    configuredUrl: process.env.REACT_APP_API_URL,
    selectedUrl: API_BASE_URL
});