import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const moreDropdownRef = useRef(null);

  // Close "More" dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setIsOpen(false);
    setIsMoreOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsOpen(false);
    setIsMoreOpen(false);
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Primary navigation items (shown directly on desktop)
  const primaryNavItems = [
    {
      name: 'Wardrobe',
      path: '/wardrobe',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      name: 'Outfits',
      path: '/outfits',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      name: 'Suggest',
      path: '/suggest',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
    {
      name: 'Stats',
      path: '/stats',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  // Secondary navigation items (inside "More" dropdown on desktop)
  const secondaryNavItems = [
    {
      name: 'History',
      path: '/history',
      description: 'Logged wears and calendar log',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Underused',
      path: '/underused',
      description: 'Clothes waiting to be worn',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Before you buy',
      path: '/before-you-buy',
      description: 'Check wardrobe for duplicates',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
  ];

  // All navigation items combined for mobile menu
  const allNavItems = [
    ...primaryNavItems,
    ...secondaryNavItems,
  ];

  // Check if any secondary link is active to highlight "More" button
  const isSecondaryActive = secondaryNavItems.some((item) =>
    location.pathname.startsWith(item.path)
  );

  // Link class with gradient pill for active state and 44px min-height
  const navLinkClass = ({ isActive }) =>
    `min-h-[44px] px-3.5 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all duration-200 flex items-center space-x-2 whitespace-nowrap select-none ${
      isActive
        ? 'bg-gradient-to-r from-violet-600/25 via-purple-600/20 to-pink-600/25 text-white border border-violet-500/40 shadow-sm shadow-violet-500/15'
        : 'text-slate-300 hover:text-white hover:bg-[#1B2440]/70 border border-transparent'
    }`;

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-40 bg-[#0B1020]/85 backdrop-blur-2xl border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo / Brand */}
          <Link
            to="/wardrobe"
            className="flex items-center space-x-2.5 group cursor-pointer focus:outline-none min-h-[44px]"
            onClick={() => setIsOpen(false)}
            aria-label="OutWear Home"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 p-0.5 shadow-md shadow-violet-500/20 group-hover:shadow-violet-500/35 transition duration-200 flex items-center justify-center">
              <span className="text-xl transform group-hover:scale-110 transition duration-200">👗</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black font-heading tracking-tight bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                OutWear
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 font-sans" aria-label="Main Navigation">
            {primaryNavItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={navLinkClass}>
                <span className="text-violet-400">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}

            {/* Desktop "More" Dropdown Menu */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen((prev) => !prev)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer select-none ${
                  isSecondaryActive || isMoreOpen
                    ? 'bg-gradient-to-r from-violet-600/25 to-pink-600/25 text-white border border-violet-500/40 shadow-sm shadow-violet-500/15'
                    : 'text-slate-300 hover:text-white hover:bg-[#1B2440]/70 border border-transparent'
                }`}
                aria-expanded={isMoreOpen}
                aria-haspopup="true"
                aria-label="More navigation links"
              >
                <span>More</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 ${
                    isMoreOpen ? 'rotate-180 text-violet-400' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Popover */}
              {isMoreOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-[#131A2E]/95 border border-slate-700/80 shadow-2xl shadow-black/50 p-2 space-y-1 backdrop-blur-2xl animate-fade-in-up z-50">
                  {secondaryNavItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMoreOpen(false)}
                      className={({ isActive }) =>
                        `flex items-start space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition min-h-[44px] ${
                          isActive
                            ? 'bg-violet-600/20 text-white border border-violet-500/30'
                            : 'text-slate-300 hover:text-white hover:bg-[#1B2440]'
                        }`
                      }
                    >
                      <span className="text-violet-400 mt-1">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.description}</div>
                      </div>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Right Side: Theme Toggle + User Avatar + Logout */}
          <div className="hidden md:flex items-center space-x-3 font-sans">
            {/* Theme Toggle Button (Light/Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-slate-300 hover:text-white bg-[#1B2440]/60 hover:bg-[#1B2440] border border-slate-700/80 hover:border-violet-500/50 transition cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              {theme === 'dark' ? (
                <span className="text-lg select-none" role="img" aria-label="Sun icon">
                  ☀️
                </span>
              ) : (
                <span className="text-lg select-none" role="img" aria-label="Moon icon">
                  🌙
                </span>
              )}
            </button>

            {/* User Avatar Circle with Initial */}
            <div className="flex items-center space-x-2">
              <div
                title={user?.name || 'User'}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-violet-500/25 border border-violet-400/30 select-none"
              >
                {userInitial}
              </div>
              <span className="text-xs font-medium text-slate-300 max-w-[120px] truncate hidden xl:inline">
                {user?.name}
              </span>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Log out of account"
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1B2440]/80 hover:bg-[#1B2440] hover:border-slate-600 border border-slate-700/80 text-xs text-slate-300 hover:text-white font-medium transition cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Mobile Right Controls: Theme Toggle + Hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Theme Toggle Button for Mobile */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-300 hover:text-white bg-[#1B2440]/60 border border-slate-700/80 flex items-center justify-center cursor-pointer"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
              className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#1B2440] border border-slate-800 transition focus:outline-none cursor-pointer flex items-center justify-center"
            >
              {isOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0B1020]/95 px-4 pt-3 pb-6 space-y-4 backdrop-blur-2xl animate-fade-in-up">
          {/* User Card */}
          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-[#131A2E]/90 border border-slate-700/60">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-600 text-white font-bold text-sm flex items-center justify-center shadow-md border border-violet-400/30">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-100 truncate">{user?.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>

          {/* Links List */}
          <nav className="flex flex-col space-y-1.5" aria-label="Mobile Navigation">
            {allNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={navLinkClass}
              >
                <span className="text-violet-400">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Log out of account"
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-xs font-semibold text-rose-300 transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
