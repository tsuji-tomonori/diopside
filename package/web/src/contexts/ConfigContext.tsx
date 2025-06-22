'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadConfig } from '../lib/config';

interface ConfigContextType {
    config: { NEXT_PUBLIC_API_URL: string } | null;
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<{ NEXT_PUBLIC_API_URL: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadConfiguration = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const loadedConfig = await loadConfig();
            setConfig(loadedConfig);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
            setError(errorMessage);
            console.error('Failed to load config:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadConfiguration();
    }, []);

    const reload = async () => {
        await loadConfiguration();
    };

    return (
        <ConfigContext.Provider value={{ config, isLoading, error, reload }}>
            {children}
        </ConfigContext.Provider>
    );
}

export function useConfig() {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
}
