package com.telecareplus.authentication;

import com.telecareplus.authentication.AuthDtos;

public interface AuthService {
    AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request);
    AuthDtos.AuthResponse login(AuthDtos.LoginRequest request);
    AuthDtos.OtpSendResponse requestLoginOtp(AuthDtos.OtpRequest request);
    AuthDtos.AuthResponse verifyLoginOtp(AuthDtos.OtpVerifyRequest request);
}
