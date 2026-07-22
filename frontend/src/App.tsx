import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { PlayGame } from './pages/PlayGame';
import { MyGames } from './pages/MyGames';
import { Academy } from './pages/Academy';
import { AcademyProgress } from './pages/AcademyProgress';
import { LessonDetails } from './pages/LessonDetails';

// Dev-only sandbox — only imported & registered in development builds.
// Vite tree-shakes this import entirely from production bundles.
const isDev = import.meta.env.DEV;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DevChessPlayground = isDev ? React.lazy(() => import('./pages/DevChessPlayground').then(m => ({ default: m.DevChessPlayground }))) : null;


// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm font-semibold tracking-wider font-display">Chaturang Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (Redirects authenticated users away from Login/Register)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm font-semibold tracking-wider font-display">Chaturang Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={<Landing />}
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/play"
            element={
              <ProtectedRoute>
                <PlayGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-games"
            element={
              <ProtectedRoute>
                <MyGames />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academy"
            element={
              <ProtectedRoute>
                <Academy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academy/:slug"
            element={
              <ProtectedRoute>
                <LessonDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <AcademyProgress />
              </ProtectedRoute>
            }
          />

          {/* ── Development-Only Sandbox Routes ────────────────────────────────
              These routes are only registered when import.meta.env.DEV is true.
              Vite strips them completely from production bundles.
              Access: http://localhost:5173/dev/chess  (no login required)
          ─────────────────────────────────────────────────────────────────── */}
          {isDev && DevChessPlayground && (
            <>
              <Route
                path="/dev/chess"
                element={
                  <React.Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
                        <p className="text-amber-400 text-sm font-mono">Loading Chess Dev Sandbox...</p>
                      </div>
                    </div>
                  }>
                    <DevChessPlayground />
                  </React.Suspense>
                }
              />
              <Route
                path="/playground/chess"
                element={
                  <React.Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
                        <p className="text-amber-400 text-sm font-mono">Loading Chess Dev Sandbox...</p>
                      </div>
                    </div>
                  }>
                    <DevChessPlayground />
                  </React.Suspense>
                }
              />
            </>
          )}

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
