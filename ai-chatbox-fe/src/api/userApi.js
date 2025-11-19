import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("userToken");
    if (token) {
        config.headers.token = token;
    }
    return config;
});

// ------- AUTH USER -------
export const registerUser = (data) =>
    API.post("/user-auth/register", data);

export const loginUser = (data) =>
    API.post("/user-auth/login", data);

export default API;
