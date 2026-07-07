import api from "./api";

export const login = async (payload) => (await api.post("/auth/login", payload, { metadata: { isAuthRequest: true } })).data;
export const register = async (payload) => (await api.post("/auth/register", payload, { metadata: { isAuthRequest: true } })).data;
export const requestOtpLogin = async (payload) => (await api.post("/auth/login/otp/request", payload, { metadata: { isAuthRequest: true } })).data;
export const verifyOtpLogin = async (payload) => (await api.post("/auth/login/otp/verify", payload, { metadata: { isAuthRequest: true } })).data;
