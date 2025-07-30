import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import {SplashPage, SignUpPage, LoginPage, Dashboard, ProfilePage, HistoryPage} from './pages'

import PolicyState from './context/PolicyState';

function App() {
  return (
    <PolicyState>
      <Router>
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Router>
    </PolicyState>
  );
}

export default App;
