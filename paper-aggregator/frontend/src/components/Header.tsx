import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="bg-orange-500 text-white px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-xl font-bold hover:underline">
            Snark Express
          </Link>
          <nav className="flex space-x-4 text-sm">
            <Link to="/" className="hover:underline">new</Link>
            <Link to="/?sort=hot" className="hover:underline">hot</Link>
            {isAuthenticated && (
              <Link to="/submit" className="hover:underline">submit</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          {isAuthenticated ? (
            <>
              <span>{user?.username}</span>
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
      </div>
    </header>
  );
}
