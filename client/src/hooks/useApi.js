/**
 * CLIENT: src/hooks/useApi.js
 * Optional hook approach for API configuration with connection testing
 */

import { useState, useEffect } from 'react';
import { initializeApi, isApiHealthy } from '../config/api';

export const useApi = () => {
    const [apiUrl, setApiUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isHealthy, setIsHealthy] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const setupApi = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const url = await initializeApi();
                const healthy = isApiHealthy();

                setApiUrl(url);
                setIsHealthy(healthy);

                if (!healthy) {
                    setError('API server is not responding. Some features may not work.');
                }
            } catch (err) {
                setError('Failed to connect to API server');
                console.error('API initialization error:', err);
                // Set a fallback URL even if initialization fails
                setApiUrl('https://virtual-advising-queue.onrender.com');
            } finally {
                setIsLoading(false);
            }
        };

        setupApi();
    }, []);

    const refresh = async () => {
        setIsLoading(true);
        try {
            const url = await initializeApi();
            const healthy = isApiHealthy();
            setApiUrl(url);
            setIsHealthy(healthy);
            setError(healthy ? null : 'API server is not responding');
        } catch (err) {
            setError('Failed to connect to API server');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        apiUrl,
        isLoading,
        isHealthy,
        error,
        refresh
    };
};