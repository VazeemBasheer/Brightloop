import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Portal from './pages/Portal';
import NotFound from './pages/NotFound';
import { AssistantProvider } from './components/app/AssistantContext';
import { CustomCursor } from './components/CustomCursor';

function ScrollRestoration() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <>
      <CustomCursor />
      <ScrollRestoration />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/app"
          element={
            <AssistantProvider>
              <Dashboard />
            </AssistantProvider>
          }
        />
        <Route
          path="/app/portal"
          element={
            <AssistantProvider>
              <Portal />
            </AssistantProvider>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
