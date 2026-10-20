import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';

/**
 * Layout component for protected application pages.
 * Includes the persistent Navbar and a centered, responsive content container.
 */
export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col items-center justify-center">
        <Outlet />
      </main>
    </div>
  );
}
