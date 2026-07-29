import api from "./api";
import { DynamicStateObject } from "./../types/DynamicState";
export const login = async (payload: DynamicStateObject) => (await api.post("/auth/login", payload, { metadata: { isAuthRequest: true } } as any)).data;
export const register = async (payload: DynamicStateObject) => (await api.post("/auth/register", payload, { metadata: { isAuthRequest: true } } as any)).data;
export const requestOtpLogin = async (payload: DynamicStateObject) => (await api.post("/auth/login/otp/request", payload, { metadata: { isAuthRequest: true } } as any)).data;
export const verifyOtpLogin = async (payload: DynamicStateObject) => (await api.post("/auth/login/otp/verify", payload, { metadata: { isAuthRequest: true } } as any)).data;
