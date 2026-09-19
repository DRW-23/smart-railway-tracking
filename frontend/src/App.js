import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PassengerDashboard from "./pages/PassengerDashboard";
import UserProfile from "./pages/UserProfile";
import TrainSchedule from "./pages/TrainSchedule";
import SeatReservation from "./pages/SeatReservation"; // Add this import
import LostFound from './pages/LostFound'; // Add this import
import FoundItem from './pages/FoundItem';
import AddItem from './pages/AddItem';
import Feedback from './pages/Feedback'; // Passenger feedback
import TrainMasterFeedback from './pages/TrainMasterFeedback';
import TrainMasterDashboard from './pages/TrainMasterDashboard';
import TrainMasterSchedule from './pages/TrainMasterSchedule';
import TrainMasterPrices from './pages/TrainMasterPrices';
// (Optional) If you later add a distinct train master feedback page reuse Feedback for now

// Simple guard that reads role saved by Login.js
const RequireRole = ({ allow, children }) => {
  const role = localStorage.getItem('role'); // no default
  return role && allow.includes(role) ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/passenger-dashboard" element={<PassengerDashboard />} />
        <Route path="/trainmaster-dashboard" element={
            <RequireRole allow={['trainmaster']}>
              <TrainMasterDashboard />
            </RequireRole>
          } 
        />
        <Route path="/train-master/schedule" element={
            <RequireRole allow={['trainmaster']}>
              <TrainMasterSchedule />
            </RequireRole>
          }
        />
        <Route path="/train-master/prices" element={
            <RequireRole allow={['trainmaster']}>
              <TrainMasterPrices />
            </RequireRole>
          }
        />
        <Route path="/train-master/feedback" element={
            <RequireRole allow={['trainmaster']}>
              <TrainMasterFeedback />
            </RequireRole>
          }
        />
        <Route path="/user-profile" element={<UserProfile />} />
        <Route path="/train-schedule" element={<TrainSchedule />} />
        <Route path="/seat-reservation" element={<SeatReservation />} /> {/* Add this route */}
        <Route path="/profile" element={<UserProfile />} /> {/* Try this alternative route too */}
        <Route path="/lost-found" element={<LostFound />} /> {/* Add this route to your existing router configuration */}
        <Route path="/found-item" element={<FoundItem />} /> {/* Add this route */}
        <Route path="/add-item" element={<AddItem />} /> {/* Add this route */}
        <Route path="/feedback" element={<Feedback />} /> {/* Add this route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
