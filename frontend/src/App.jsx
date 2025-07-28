import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Splash from './pages/splash';
import Home from './pages/home';
import SignUp from './pages/signup';
import Login from './pages/login';
import HistoryPage from './pages/history';
import ProfilePage from './pages/profile';
import PolicyState from './context/PolicyState';

function App() {
  return (
    <PolicyState>
      <Router>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Router>
    </PolicyState>
  );
}

export default App;
