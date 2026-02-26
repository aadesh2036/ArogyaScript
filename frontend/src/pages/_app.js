import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
