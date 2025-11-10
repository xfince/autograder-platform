import { useState } from "react";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom"; // ✅ fixed import
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ use context login function
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", form);

      // 👇 Combine user + token into single object (as AuthContext expects)
      const userData = {
        ...res.data.user,
        token: res.data.token,
      };

      // ✅ Call context login (which also updates localStorage)
      login(userData);

      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center [background:radial-gradient(125%_125%_at_50%_10%,#000_60%,#00FF9D40_100%)]">
      <div className="card w-96 bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-center mb-4 text-primary">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit}>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="input input-bordered w-full mb-3"
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="input input-bordered w-full mb-3"
              required
            />

            <button className="btn btn-primary w-full mt-2" type="submit">
              Login
            </button>
          </form>

          <p className="text-center mt-3 text-sm">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-primary">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
