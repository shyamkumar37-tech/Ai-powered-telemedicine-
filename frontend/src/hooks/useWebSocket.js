import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

export function useWebSocket(subscribeUrl, onMessageReceived) {
    // In a real app we'd get this from a proper context, but currently the app uses localStorage.
    const token = localStorage.getItem('token');
    
    const [connected, setConnected] = useState(false);
    const stompClientRef = useRef(null);

    // Track the latest callback so we don't need to re-subscribe if the callback reference changes
    const callbackRef = useRef(onMessageReceived);
    useEffect(() => {
        callbackRef.current = onMessageReceived;
    }, [onMessageReceived]);

    useEffect(() => {
        if (!token) return;

        const client = new Client({
            // Use SockJS as fallback if native WebSockets are blocked
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-telecare'),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                // console.log(str); // Uncomment for STOMP debugging
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            setConnected(true);
            if (subscribeUrl) {
                client.subscribe(subscribeUrl, (message) => {
                    if (message.body && callbackRef.current) {
                        callbackRef.current(JSON.parse(message.body));
                    }
                });
            }
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
            setConnected(false);
        };

        client.onWebSocketClose = () => {
            setConnected(false);
        };

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [token, subscribeUrl]); 

    const sendMessage = (destination, body) => {
        if (stompClientRef.current && connected) {
            stompClientRef.current.publish({
                destination: destination,
                body: JSON.stringify(body)
            });
        }
    };

    return { connected, sendMessage };
}
