import api from "./api";
import { DynamicStateObject } from "./../types/DynamicState";

// @ts-expect-error - Auto-suppressed during migration
export const login = async (payload: DynamicStateObject) => (await api.post("/auth/login", payload, { metadata: { isAuthRequest: true } })).data;
// @ts-expect-error - Auto-suppressed during migration
export const register = async (payload: DynamicStateObject) => (await api.post("/auth/register", payload, { metadata: { isAuthRequest: true } })).data;
// @ts-expect-error - Auto-suppressed during migration
export const requestOtpLogin = async (payload: DynamicStateObject) => (await api.post("/auth/login/otp/request", payload, { metadata: { isAuthRequest: true } })).data;
// @ts-expect-error - Auto-suppressed during migration
export const verifyOtpLogin = async (payload: DynamicStateObject) => (await api.post("/auth/login/otp/verify", payload, { metadata: { isAuthRequest: true } })).data;
