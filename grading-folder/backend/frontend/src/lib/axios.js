import axios from "axios";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001/api" // your backend running locally
    : "https://note-ado-13.onrender.com/api"; // your Render backend URL

const api = axios.create({
  baseURL: BASE_URL,
});

export default api;
