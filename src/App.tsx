import { AuthProvider } from './components/AuthProvider';
import { MainContent } from './components/MainContent';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-950 antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <MainContent />
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  );
}
