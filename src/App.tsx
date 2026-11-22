import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import RegisterWrapper from './components/Auth/RegisterWrapper';
import LoginWrapper from './components/Auth/LoginWrapper';
import Profile from './components/Profile';
import OrganizerApplication from './pages/OrganizerApplication';
import EventListPage from './pages/EventListPage';
import AdminPanel from './pages/AdminPanel';
import OrganizerDashboard from './pages/OrganizerDashboard';
import FakePaymentPage from './pages/FakePaymentPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import './App.css';
import './components/Auth/Auth.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventListPage />} />
              <Route path="/register" element={<RegisterWrapper />} />
              <Route path="/login" element={<LoginWrapper />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/organizer-application" element={
                <ProtectedRoute>
                  <OrganizerApplication />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <AdminPanel />
                </ProtectedRoute>
              } />
              <Route path="/organizer/dashboard" element={
                <ProtectedRoute organizerOnly>
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/pay/:paymentId" element={<FakePaymentPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
