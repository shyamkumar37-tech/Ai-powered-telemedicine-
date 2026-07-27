package com.telecareplus.controller;

import com.telecareplus.dto.AuthDtos;
import com.telecareplus.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user registration, login, and OTP verification.")
@RateLimiter(name = "api")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new user", description = "Creates a new user account with the specified role.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User registered successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request format or missing fields"),
        @ApiResponse(responseCode = "409", description = "User with email already exists")
    })
    @PostMapping("/register")
    public AuthDtos.AuthResponse register(@Valid @RequestBody AuthDtos.RegisterRequest request, HttpServletResponse response) {
        AuthDtos.AuthResponse authResponse = authService.register(request);
        setJwtCookie(response, authResponse.token());
        return authResponse;
    }

    @Operation(summary = "Authenticate user", description = "Login with email and password to receive a JWT token.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Authenticated successfully"),
        @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request, HttpServletResponse response) {
        AuthDtos.AuthResponse authResponse = authService.login(request);
        setJwtCookie(response, authResponse.token());
        return authResponse;
    }

    @Operation(summary = "Request Login OTP", description = "Sends a One-Time Password to the user's registered device.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "OTP sent successfully"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    @PostMapping("/login/otp/request")
    public AuthDtos.OtpSendResponse requestOtp(@Valid @RequestBody AuthDtos.OtpRequest request) {
        return authService.requestLoginOtp(request);
    }

    @Operation(summary = "Verify Login OTP", description = "Verifies the provided OTP and issues a JWT token if successful.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "OTP verified, user authenticated"),
        @ApiResponse(responseCode = "401", description = "Invalid or expired OTP")
    })
    @PostMapping("/login/otp/verify")
    public AuthDtos.AuthResponse verifyOtp(@Valid @RequestBody AuthDtos.OtpVerifyRequest request, HttpServletResponse response) {
        AuthDtos.AuthResponse authResponse = authService.verifyLoginOtp(request);
        setJwtCookie(response, authResponse.token());
        return authResponse;
    }

    private void setJwtCookie(HttpServletResponse response, String token) {
        if (token != null) {
            Cookie cookie = new Cookie("jwt", token);
            cookie.setHttpOnly(true);
            cookie.setSecure(true);
            cookie.setPath("/");
            cookie.setMaxAge(86400); // 24 hours
            // Using setHeader for SameSite since Cookie doesn't natively support it in Servlet API easily without wrappers in older versions, but addCookie is safe for now
            response.addCookie(cookie);
        }
    }
}
