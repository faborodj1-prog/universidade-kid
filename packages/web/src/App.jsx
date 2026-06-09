import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAppStore from "./store/useAppStore";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Trails from "./pages/Trails";
import TrailDetail from "./pages/TrailDetail";
import Course from "./pages/Course";
import Visits from "./pages/Visits";
import Ranking from "./pages/Ranking";
import Certificates from "./pages/Certificates";
import Reports from "./pages/Reports";

function PrivateRoute({ children }) {
  const user = useAppStore((s) => s.user);
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const user = useAppStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!["ADMIN", "MANAGER"].includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="trails" element={<Trails />} />
          <Route path="trails/:id" element={<TrailDetail />} />
          <Route path="trails/:trailId/modules/:moduleId" element={<Course />} />
          <Route path="visits" element={<Visits />} />
          <Route path="ranking" element={<Ranking />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
