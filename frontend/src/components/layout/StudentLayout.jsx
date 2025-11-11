// src/components/layout/StudentLayout.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function StudentLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: '📊', label: 'Dashboard', path: '/dashboard' },
    { icon: '📚', label: 'Courses', path: '/courses' },
    { icon: '🎓', label: 'My Learning', path: '/my-learning' },
    { icon: '🏆', label: 'Achievements', path: '/achievements' },
    { icon: '📈', label: 'Leaderboard', path: '/leaderboard' },
    { icon: '👤', label: 'Profile', path: '/profile' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top Navigation */}
      <nav className="glass-card sticky top-0 z-50 border-b border-white/20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <span className="text-3xl">🤖</span>
                <span className="font-bold text-xl gradient-text hidden sm:block">
                  AI Academy
                </span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-2">
              {menuItems.map((item) => (
                <motion.button
                  key={item.path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                      : 'hover:bg-white/50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </motion.button>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span>🔥</span>
                  <span className="font-bold">{user?.streak?.count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span className="font-bold">{user?.points || 0}</span>
                </div>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-all"
                >
                  <img
                    src={user?.avatar || 'https://ui-avatars.com/api/?name=' + user?.name}
                    alt={user?.name}
                    className="w-10 h-10 rounded-full border-2 border-primary-500"
                  />
                  <span className="hidden sm:block font-medium">{user?.name}</span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 glass-card rounded-xl shadow-xl overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setProfileOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-white/50 transition-colors flex items-center gap-2"
                      >
                        <span>👤</span> Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                      >
                        <span>🚪</span> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 bottom-0 w-64 glass-card z-50 p-6 lg:hidden"
            >
              <div className="flex items-center gap-2 mb-8">
                <span className="text-3xl">🤖</span>
                <span className="font-bold text-xl gradient-text">AI Academy</span>
              </div>
              
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-left font-medium transition-all flex items-center gap-3 ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                        : 'hover:bg-white/50'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-73px)]">
        {children}
      </main>
    </div>
  );
}