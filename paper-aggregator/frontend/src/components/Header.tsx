import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { Link } from 'react-router-dom';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-orange-500 text-white px-2 sm:px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/" className="text-lg sm:text-xl font-bold hover:underline flex-shrink-0">
            Snark Express
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4 text-sm">
            <Link to="/" className="hover:underline">new</Link>
            <Link to="/?sort=hot" className="hover:underline">hot</Link>
            <Link to="/search" className="hover:underline">search</Link>
            {isAuthenticated && (
              <Link to="/submit" className="hover:underline">submit</Link>
            )}
          </nav>
        </div>

        {/* Desktop User Menu and Theme Toggle */}
        <div className="hidden md:flex items-center space-x-4 text-sm flex-shrink-0">
          <button
            onClick={toggleTheme}
            className="p-1.5 hover:bg-orange-600 rounded transition-colors"
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          {isAuthenticated ? (
            <>
              <Link to={`/user/${user?.username}`} className="hover:underline max-w-[150px] truncate">
                {user?.username}
              </Link>
              <button
                onClick={logout}
                className="hover:underline"
              >
                logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">login</Link>
              <Link to="/register" className="hover:underline">register</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-1 hover:bg-orange-600 rounded transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-2 pb-2 border-t border-orange-400 pt-2">
          <nav className="flex flex-col space-y-2 text-sm">
            <Link
              to="/"
              className="hover:bg-orange-600 px-2 py-1 rounded transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              new
            </Link>
            <Link
              to="/?sort=hot"
              className="hover:bg-orange-600 px-2 py-1 rounded transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              hot
            </Link>
            <Link
              to="/search"
              className="hover:bg-orange-600 px-2 py-1 rounded transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              search
            </Link>
            {isAuthenticated && (
              <Link
                to="/submit"
                className="hover:bg-orange-600 px-2 py-1 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                submit
              </Link>
            )}
            <div className="border-t border-orange-400 my-2"></div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 hover:bg-orange-600 px-2 py-1 rounded transition-colors text-left"
            >
              {theme === 'light' ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span>dark mode</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>light mode</span>
                </>
              )}
            </button>
            <div className="border-t border-orange-400 my-2"></div>
            {isAuthenticated ? (
              <>
                <Link
                  to={`/user/${user?.username}`}
                  className="hover:bg-orange-600 px-2 py-1 rounded transition-colors truncate"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {user?.username}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="text-left hover:bg-orange-600 px-2 py-1 rounded transition-colors"
                >
                  logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:bg-orange-600 px-2 py-1 rounded transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  login
                </Link>
                <Link
                  to="/register"
                  className="hover:bg-orange-600 px-2 py-1 rounded transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
