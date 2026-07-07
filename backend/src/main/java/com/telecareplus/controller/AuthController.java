package com.telecareplus.controller;

import com.telecareplus.dto.AuthDtos;
import com.telecareplus.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public AuthDtos.AuthResponse register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/login/otp/request")
    public AuthDtos.OtpSendResponse requestOtp(@Valid @RequestBody AuthDtos.OtpRequest request) {
        return authService.requestLoginOtp(request);
    }

    @PostMapping("/login/otp/verify")
    public AuthDtos.AuthResponse verifyOtp(@Valid @RequestBody AuthDtos.OtpVerifyRequest request) {
        return authService.verifyLoginOtp(request);
    }
}
