import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import Layout from './components/Layout.jsx';
import AuroraBackground from './components/ui/AuroraBackground.jsx';

import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Wardrobe from './pages/Wardrobe.jsx';
import AddItem from './pages/AddItem.jsx';
import EditItem from './pages/EditItem.jsx';
import Outfits from './pages/Outfits.jsx';
import OutfitBuilder from './pages/OutfitBuilder.jsx';
import Suggest from './pages/Suggest.jsx';
import BeforeYouBuy from './pages/BeforeYouBuy.jsx';
import History from './pages/History.jsx';
import Underused from './pages/Underused.jsx';
import Stats from './pages/Stats.jsx';
import NotFound from './pages/NotFound.jsx';

/**
 * Route-aware document.title manager
 */
function PageTitleTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'OutWear · Modern Wardrobe & Style Tracker';

    if (path === '/login') {
      title = 'Sign In · OutWear';
    } else if (path === '/signup') {
      title = 'Create Account · OutWear';
    } else if (path === '/wardrobe') {
      title = 'My Wardrobe · OutWear';
    } else if (path === '/wardrobe/add') {
      title = 'Add Item · OutWear';
    } else if (path.startsWith('/wardrobe/') && path.endsWith('/edit')) {
      title = 'Edit Item · OutWear';
    } else if (path === '/outfits') {
      title = 'My Outfits · OutWear';
    } else if (path === '/outfits/new') {
      title = 'Create Outfit · OutWear';
    } else if (path.startsWith('/outfits/') && path.endsWith('/edit')) {
      title = 'Edit Outfit · OutWear';
    } else if (path === '/suggest') {
      title = 'Style Suggestions · OutWear';
    } else if (path === '/before-you-buy') {
      title = 'Before You Buy · OutWear';
    } else if (path === '/history') {
      title = 'Wear History · OutWear';
    } else if (path === '/underused') {
      title = 'Underused Clothes · OutWear';
    } else if (path === '/stats') {
      title = 'Wardrobe Analytics · OutWear';
    } else {
      title = 'Page Not Found · OutWear';
    }

    document.title = title;
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <PageTitleTracker />
        <AuroraBackground />
        <AuthProvider>
          <Routes>
            {/* Root redirect to /wardrobe */}
            <Route path="/" element={<Navigate to="/wardrobe" replace />} />

            {/* Public-only routes: /login and /signup */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            {/* Protected routes with Layout and Navbar */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/wardrobe" element={<Wardrobe />} />
                <Route path="/wardrobe/add" element={<AddItem />} />
                <Route path="/wardrobe/:id/edit" element={<EditItem />} />
                <Route path="/outfits" element={<Outfits />} />
                <Route path="/outfits/new" element={<OutfitBuilder />} />
                <Route path="/outfits/:id/edit" element={<OutfitBuilder />} />
                <Route path="/suggest" element={<Suggest />} />
                <Route path="/before-you-buy" element={<BeforeYouBuy />} />
                <Route path="/history" element={<History />} />
                <Route path="/underused" element={<Underused />} />
                <Route path="/stats" element={<Stats />} />
              </Route>
            </Route>

            {/* 404 Not Found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
