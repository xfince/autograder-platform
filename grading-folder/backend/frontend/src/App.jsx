import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import CreatePage from "./pages/CreatePage";
import NoteDetailPage from "./pages/NoteDetail";
import EditNotePage from "./pages/EditNotePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";

const App = () => {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_60%,#00FF9D40_100%)]" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/create" 
          element={
            <ProtectedRoute>
              <CreatePage />
            </ProtectedRoute>
          } 
        />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/note/:id" element={<NoteDetailPage />} />
        <Route 
          path="/notes/:id/edit" 
          element={
            <ProtectedRoute>
              <EditNotePage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
};

export default App;