import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shirt,
  Layers,
  Wand2,
  Clock,
  BarChart3,
  History,
  ShoppingBag,
  Bell,
  LogOut,
  ChevronDown,
  MoreHorizontal,
  X,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { IconButton } from './ui/IconButton.jsx';

// Route path to clean page title mapping
function getPageTitle(pathname) {
  if (pathname === '/wardrobe/add') return 'Add Wardrobe Item';
  if (pathname.startsWith('/wardrobe/') && pathname.endsWith('/edit')) return 'Edit Wardrobe Item';
  if (pathname.startsWith('/wardrobe')) return 'Wardrobe';
  if (pathname === '/outfits/new') return 'Outfit Builder';
  if (pathname.startsWith('/outfits/') && pathname.endsWith('/edit')) return 'Edit Outfit';
  if (pathname.startsWith('/outfits')) return 'My Outfits';
  if (pathname.startsWith('/suggest')) return 'Outfit Suggestions';
  if (pathname.startsWith('/underused')) return 'Underused Clothes';
  if (pathname.startsWith('/stats')) return 'Wardrobe Analytics';
  if (pathname.startsWith('/history')) return 'Wear History';
  if (pathname.startsWith('/before-you-buy')) return 'Before You Buy';
  return 'Wardrobe Dashboard';
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Mobile "More" sheet state & desktop user dropdown state
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showNotificationsToast, setShowNotificationsToast] = useState(false);

  const userMenuRef = useRef(null);

  // Close menus when route changes
  useEffect(() => {
    setIsMoreSheetOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Click outside listener for user dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';
  const pageTitle = getPageTitle(location.pathname);

  // Full desktop rail navigation icons
  const navItems = [
    { name: 'Wardrobe', path: '/wardrobe', icon: Shirt },
    { name: 'Outfits', path: '/outfits', icon: Layers },
    { name: 'Suggest', path: '/suggest', icon: Wand2 },
    { name: 'Underused', path: '/underused', icon: Clock },
    { name: 'Stats', path: '/stats', icon: BarChart3 },
    { name: 'History', path: '/history', icon: History },
    { name: 'Before you buy', path: '/before-you-buy', icon: ShoppingBag },
  ];

  // Mobile 4 primary tabs
  const mobilePrimaryTabs = [
    { name: 'Wardrobe', path: '/wardrobe', icon: Shirt },
    { name: 'Outfits', path: '/outfits', icon: Layers },
    { name: 'Suggest', path: '/suggest', icon: Wand2 },
    { name: 'Stats', path: '/stats', icon: BarChart3 },
  ];

  // Secondary items shown inside mobile "More" sheet
  const mobileSecondaryItems = [
    { name: 'Underused Clothes', path: '/underused', icon: Clock, desc: 'Unworn or neglected pieces' },
    { name: 'Wear History', path: '/history', icon: History, desc: 'Logged wears & timeline log' },
    { name: 'Before You Buy', path: '/before-you-buy', icon: ShoppingBag, desc: 'Duplicate closet check' },
    { name: 'Add New Item', path: '/wardrobe/add', icon: Plus, desc: 'Upload clothes to wardrobe' },
    { name: 'Create Outfit', path: '/outfits/new', icon: Sparkles, desc: 'Curate a new styled look' },
  ];

  return (
    <div className="min-h-screen text-[#1E2140] font-sans flex flex-col antialiased selection:bg-[#E3E6FB] selection:text-[#4F5BD5]">
      {/* ──────────────────────────────────────────────────────────────────────────
          DESKTOP (lg+): FLOATING WHITE GLASS SIDEBAR RAIL ON THE LEFT
         ────────────────────────────────────────────────────────────────────────── */}
      <aside
        aria-label="Sidebar Rail"
        className="hidden lg:flex fixed left-5 top-5 bottom-5 w-18 z-40 rounded-3xl bg-white/65 border border-white/60 backdrop-blur-2xl shadow-[0_10px_40px_rgba(99,102,241,0.12)] flex-col items-center justify-between py-5 select-none transition-all duration-200"
      >
        {/* OutWear Logo Chip on Top */}
        <div className="flex flex-col items-center">
          <Link
            to="/wardrobe"
            title="OutWear Home"
            aria-label="OutWear Home"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4F5BD5] to-[#707BF7] shadow-[0_4px_16px_rgba(79,91,213,0.35)] flex items-center justify-center text-white text-xl hover:scale-105 active:scale-95 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[#4F5BD5]"
          >
            <span className="transform group-hover:rotate-6 transition-transform duration-200">👗</span>
          </Link>
        </div>

        {/* Center Nav Icons with Tooltips */}
        <nav className="flex flex-col items-center space-y-2.5 my-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.path} className="relative group flex items-center justify-center">
                <NavLink
                  to={item.path}
                  aria-label={item.name}
                  className={({ isActive }) =>
                    `w-11 h-11 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F5BD5] ${
                      isActive
                        ? 'bg-[#4F5BD5] text-white shadow-[0_4px_16px_rgba(79,91,213,0.35)] scale-105'
                        : 'text-[#6B7194] hover:text-[#4F5BD5] hover:bg-white/70 active:bg-white/90'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                </NavLink>

                {/* Floating Hover Tooltip Pill */}
                <div
                  role="tooltip"
                  className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1E2140] text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 shadow-xl z-50 flex items-center"
                >
                  <span>{item.name}</span>
                  {/* Subtle triangle arrow */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1E2140]" />
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Icons: Bell + Logout */}
        <div className="flex flex-col items-center space-y-2 pt-2 border-t border-white/40 w-11">
          {/* Bell Icon */}
          <div className="relative group flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                setShowNotificationsToast(true);
                setTimeout(() => setShowNotificationsToast(false), 3000);
              }}
              title="Notifications"
              aria-label="View notifications"
              className="w-11 h-11 rounded-full text-[#6B7194] hover:text-[#4F5BD5] hover:bg-white/70 flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F5BD5]"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div
              role="tooltip"
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1E2140] text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 shadow-xl z-50 flex items-center"
            >
              <span>Notifications</span>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1E2140]" />
            </div>
          </div>

          {/* Logout Icon */}
          <div className="relative group flex items-center justify-center">
            <button
              type="button"
              onClick={handleLogout}
              title="Log Out"
              aria-label="Log out of account"
              className="w-11 h-11 rounded-full text-[#6B7194] hover:text-[#C2492E] hover:bg-[#FBE3DC]/60 flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C2492E]"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div
              role="tooltip"
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1E2140] text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 shadow-xl z-50 flex items-center"
            >
              <span>Log out</span>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1E2140]" />
            </div>
          </div>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────────────────────
          MAIN AREA (Offset on Desktop to accommodate floating left rail)
         ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:pl-28 transition-all duration-200">
        {/* DESKTOP TOP BAR (lg+) */}
        <header className="hidden lg:flex items-center justify-between h-18 px-8 pt-5 pb-3">
          {/* Page Title on the Left (from route) */}
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black font-heading text-[#1E2140] tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-xs text-[#6B7194] font-sans">
              Smart, mindful closet curation & style tracker
            </p>
          </div>

          {/* User Chip on the Right: Avatar Circle with Initial, Name, Small Chevron */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
              aria-label="User account menu"
              className="min-h-[44px] pl-1.5 pr-3 py-1.5 rounded-full bg-white/70 hover:bg-white border border-white/80 shadow-[0_4px_16px_rgba(99,102,241,0.08)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.14)] backdrop-blur-md flex items-center space-x-2.5 transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#4F5BD5]"
            >
              {/* Avatar circle with initial */}
              <div className="w-8 h-8 rounded-full bg-[#E3E6FB] border border-[#D4D8F7] text-[#4F5BD5] font-bold text-xs flex items-center justify-center shadow-xs">
                {userInitial}
              </div>

              {/* User Name */}
              <span className="text-sm font-semibold text-[#1E2140] max-w-[140px] truncate">
                {user?.name || 'My Closet'}
              </span>

              {/* Small Chevron */}
              <ChevronDown
                className={`w-4 h-4 text-[#6B7194] transition-transform duration-200 ${
                  isUserMenuOpen ? 'rotate-180 text-[#4F5BD5]' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 rounded-3xl bg-white/90 border border-white/80 shadow-[0_16px_50px_rgba(99,102,241,0.18)] p-2 space-y-1 backdrop-blur-2xl animate-fade-in z-50">
                <div className="px-3.5 py-2.5 border-b border-white/60">
                  <div className="font-bold text-sm text-[#1E2140] truncate">{user?.name}</div>
                  <div className="text-xs text-[#6B7194] truncate">{user?.email}</div>
                </div>

                <div className="p-1 space-y-1">
                  <Link
                    to="/wardrobe/add"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1E2140] hover:text-[#4F5BD5] hover:bg-[#E3E6FB]/60 transition"
                  >
                    <Plus className="w-4 h-4 text-[#4F5BD5]" />
                    <span>Add Item</span>
                  </Link>

                  <Link
                    to="/outfits/new"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1E2140] hover:text-[#4F5BD5] hover:bg-[#E3E6FB]/60 transition"
                  >
                    <Sparkles className="w-4 h-4 text-[#4F5BD5]" />
                    <span>Create Outfit</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-white/60">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#C2492E] hover:bg-[#FBE3DC]/60 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-[#C2492E]" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ──────────────────────────────────────────────────────────────────────────
            MOBILE TOP BAR (< lg): LOGO + AVATAR
           ────────────────────────────────────────────────────────────────────────── */}
        <header className="lg:hidden sticky top-3 z-40 mx-4 mb-3 rounded-2xl bg-white/75 border border-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgba(99,102,241,0.10)] px-4 py-2.5 flex items-center justify-between select-none">
          {/* Logo & Brand */}
          <Link
            to="/wardrobe"
            className="flex items-center space-x-2 focus:outline-none min-h-[44px]"
            aria-label="OutWear Home"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4F5BD5] to-[#707BF7] flex items-center justify-center text-white text-base shadow-xs">
              👗
            </div>
            <span className="font-extrabold font-heading text-lg text-[#1E2140] tracking-tight">
              OutWear
            </span>
          </Link>

          {/* Title Chip or User Avatar */}
          <button
            type="button"
            onClick={() => setIsMoreSheetOpen(true)}
            aria-label="Open navigation menu"
            className="min-w-[44px] min-h-[44px] pl-2 pr-3 py-1 rounded-full bg-white/80 hover:bg-white border border-white/80 shadow-xs flex items-center space-x-2 text-xs font-semibold text-[#1E2140] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-[#E3E6FB] text-[#4F5BD5] font-bold text-xs flex items-center justify-center">
              {userInitial}
            </div>
            <span className="max-w-[80px] truncate">{user?.name?.split(' ')[0] || 'Menu'}</span>
            <MoreHorizontal className="w-3.5 h-3.5 text-[#6B7194]" />
          </button>
        </header>

        {/* ──────────────────────────────────────────────────────────────────────────
            MAIN CONTENT AREA: GENTLE FADE-IN & RESPONSIVE PADDING
           ────────────────────────────────────────────────────────────────────────── */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 lg:pb-8 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          MOBILE FLOATING BOTTOM TAB BAR (< lg)
          4 most important links + "More" sheet trigger
         ────────────────────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 rounded-full bg-white/85 border border-white/70 backdrop-blur-2xl shadow-[0_12px_40px_rgba(99,102,241,0.20)] p-1.5 flex items-center justify-around select-none"
      >
        {mobilePrimaryTabs.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.name}
              className={({ isActive }) =>
                `w-11 h-11 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F5BD5] ${
                  isActive
                    ? 'bg-[#4F5BD5] text-white shadow-[0_4px_16px_rgba(79,91,213,0.30)] scale-105'
                    : 'text-[#6B7194] hover:text-[#4F5BD5] active:scale-95'
                }`
              }
            >
              <Icon className="w-5 h-5" />
            </NavLink>
          );
        })}

        {/* "More" Trigger Button */}
        <button
          type="button"
          onClick={() => setIsMoreSheetOpen(true)}
          aria-label="More navigation options"
          aria-expanded={isMoreSheetOpen}
          className={`w-11 h-11 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F5BD5] ${
            isMoreSheetOpen
              ? 'bg-[#4F5BD5] text-white shadow-[0_4px_16px_rgba(79,91,213,0.30)]'
              : 'text-[#6B7194] hover:text-[#4F5BD5] active:scale-95'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </nav>

      {/* ──────────────────────────────────────────────────────────────────────────
          MOBILE "MORE" GLASS BOTTOM SHEET
         ────────────────────────────────────────────────────────────────────────── */}
      {isMoreSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More options"
          className="fixed inset-0 z-50 flex items-end lg:hidden"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#1E2140]/30 backdrop-blur-md transition-opacity animate-fade-in"
            onClick={() => setIsMoreSheetOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-up Glass Sheet */}
          <div className="relative w-full max-w-lg mx-auto bg-white/95 border-t border-white/80 rounded-t-3xl shadow-[0_-16px_50px_rgba(99,102,241,0.22)] p-6 space-y-4 backdrop-blur-2xl animate-fade-in z-10 pb-8">
            {/* Sheet Handle & Close */}
            <div className="flex items-center justify-between pb-2 border-b border-white/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-[#E3E6FB] text-[#4F5BD5] font-bold text-xs flex items-center justify-center">
                  {userInitial}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1E2140]">{user?.name}</div>
                  <div className="text-xs text-[#6B7194]">{user?.email}</div>
                </div>
              </div>

              <IconButton
                size="sm"
                variant="white"
                onClick={() => setIsMoreSheetOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </IconButton>
            </div>

            {/* Navigation Links Grid */}
            <div className="space-y-1.5">
              {mobileSecondaryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreSheetOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center space-x-3.5 px-3.5 py-3 rounded-2xl transition min-h-[44px] ${
                        isActive
                          ? 'bg-[#E3E6FB] text-[#4F5BD5] font-bold shadow-xs'
                          : 'text-[#1E2140] hover:bg-white/80'
                      }`
                    }
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/80 text-[#4F5BD5] flex items-center justify-center shadow-xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{item.name}</div>
                      <div className="text-xs text-[#6B7194]">{item.desc}</div>
                    </div>
                  </NavLink>
                );
              })}
            </div>

            {/* Logout Option */}
            <div className="pt-2 border-t border-white/60">
              <button
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  handleLogout();
                }}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#FBE3DC] hover:bg-[#F9D5CB] text-[#C2492E] font-semibold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Demo Toast */}
      {showNotificationsToast && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl bg-white/90 border border-white/80 shadow-[0_10px_35px_rgba(99,102,241,0.16)] px-4 py-3 backdrop-blur-xl animate-fade-in text-xs font-semibold text-[#1E2140] flex items-center space-x-2">
          <span>🔔</span>
          <span>All wardrobe notifications are up to date!</span>
        </div>
      )}
    </div>
  );
}
