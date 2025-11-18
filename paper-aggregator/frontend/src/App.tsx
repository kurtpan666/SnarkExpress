import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { PaperList } from './components/PaperList';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Submit } from './pages/Submit';
import { UserProfile } from './pages/UserProfile';
import { Search } from './pages/Search';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
            <Header />
            <Routes>
              <Route path="/" element={<PaperList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/submit" element={<Submit />} />
              <Route path="/user/:username" element={<UserProfile />} />
              <Route path="/search" element={<Search />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
