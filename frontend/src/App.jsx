import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Loader } from '@/components/ui/Loader';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Lazy load pages for performance
const Home = React.lazy(() => import('@/pages/Home'));
const Login = React.lazy(() => import('@/pages/auth/Login'));
const Register = React.lazy(() => import('@/pages/auth/Register'));
const Profile = React.lazy(() => import('@/pages/profile/Profile'));
const Subscriptions = React.lazy(() => import('@/pages/subscriptions/Subscriptions'));
const Downloads = React.lazy(() => import('@/pages/downloads/Downloads'));
const UploadVideo = React.lazy(() => import('@/pages/upload/UploadVideo'));
const MyLibrary = React.lazy(() => import('@/pages/library/MyLibrary'));
const CreateWatchParty = React.lazy(() => import('@/pages/watch-party/CreateWatchParty'));
const VideoDetails = React.lazy(() => import('@/pages/videos/VideoDetails'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center"><Loader size={32} /></div>}>
          <Routes>
            <Route element={<MainLayout />}>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/video/:id" element={<VideoDetails />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/downloads" element={<Downloads />} />
                <Route path="/upload" element={<UploadVideo />} />
                <Route path="/library" element={<MyLibrary />} />
                <Route path="/watch-party/create" element={<CreateWatchParty />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
