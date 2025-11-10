import { useState } from "react";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router";

const SignupPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", form);
      toast.success("Account created! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center [background:radial-gradient(125%_125%_at_50%_10%,#000_60%,#00FF9D40_100%)]">
      <div className="card w-96 bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-center mb-4 text-primary">Create Account</h2>

          <form onSubmit={handleSubmit}>
            <input
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className="input input-bordered w-full mb-3"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="input input-bordered w-full mb-3"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="input input-bordered w-full mb-3"
            />

            <button className="btn btn-primary w-full mt-2">Sign Up</button>
          </form>

          <p className="text-center mt-3 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default SignupPage;
