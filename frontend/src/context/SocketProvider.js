import { createContext, useContext, useEffect, useState } from 'react';

const SocketContext = createContext(null);

/**
 * SocketProvider – wraps Socket.io client for real-time pipeline events.
 * Falls back gracefully when no server is available (demo mode).
 *
 * The backend team should:
 *  1. `npm install socket.io-client`
 *  2. Connect to their Socket.io server URL.
 *  3. Emit events matching the pipeline steps.
 */
export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Attempt dynamic import so the app doesn't crash if socket.io-client isn't installed.
        let cleanup = () => { };

        (async () => {
            try {
                const { io } = await import('socket.io-client');
                const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
                const s = io(url, { autoConnect: true, reconnectionAttempts: 3, timeout: 5000 });

                s.on('connect', () => setIsConnected(true));
                s.on('disconnect', () => setIsConnected(false));
                s.on('connect_error', () => {
                    console.info('[SocketProvider] Server not available — running in demo mode.');
                    setIsConnected(false);
                });

                setSocket(s);
                cleanup = () => s.disconnect();
            } catch {
                // socket.io-client not installed — demo mode.
                console.info('[SocketProvider] socket.io-client not installed — running in demo mode.');
            }
        })();

        return () => cleanup();
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}

/** Hook to access the socket instance & connection status. */
export function useSocket() {
    return useContext(SocketContext) || { socket: null, isConnected: false };
}
