import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-base-300 border-b border-base-content/10">
      <div className="mx-auto max-w-6xl p-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-3xl font-bold text-primary font-mono tracking-tight">
            ThinkBoard
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <Link to="/signup" className="btn btn-outline btn-primary">
                  Sign Up
                </Link>
                <Link to="/login" className="btn btn-primary">
                  Login
                </Link>
              </>
            ) : (
              <>
                <Link to="/create" className="btn btn-primary flex items-center gap-1">
                  <Plus className="size-5" />
                  <span>New Note</span>
                </Link>

                <button onClick={handleLogout} className="btn btn-error">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;