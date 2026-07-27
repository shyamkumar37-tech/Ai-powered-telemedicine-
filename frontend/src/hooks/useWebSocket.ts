import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { wsService } from '../services/websocketService';
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

export function useWebSocket(subscribeUrl: DynamicStateObject, onMessageReceived: DynamicStateObject) {
    const { auth } = useAuth();
    // @ts-expect-error - Auto-suppressed during migration
    const [connected, setConnected] = useState<DynamicState>(wsService.connected);

    const callbackRef = useRef<DynamicState>(onMessageReceived);
    useEffect(() => {
        callbackRef.current = onMessageReceived;
    }, [onMessageReceived]);

    useEffect(() => {
        // Sync connection state
        const checkConnection = () => {
            // @ts-expect-error - Auto-suppressed during migration
            setConnected(wsService.connected);
        };
        const interval = setInterval(checkConnection, 1000);
        checkConnection();
        
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // @ts-expect-error - Auto-suppressed during migration
        if (!auth?.token || !wsService.connected || !subscribeUrl) return;

        const handleMessage = (msg: DynamicStateObject) => {
            if (callbackRef.current) {
                callbackRef.current(msg);
            }
        };

        wsService.subscribe(subscribeUrl, handleMessage);

        return () => {
            wsService.unsubscribe(subscribeUrl);
        };
    }, [auth?.token, connected, subscribeUrl]);

    const sendMessage = (destination: DynamicStateObject, body: DynamicStateObject) => {
        wsService.send(destination, body);
    };

    return { connected, sendMessage };
}
