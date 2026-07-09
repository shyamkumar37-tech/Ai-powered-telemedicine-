package com.telecareplus.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;
    
    // Fallback if needed, we can decode JWT and manually create Authentication token.
    // In Spring Security OAuth2 resource server, you usually need a JWT Authentication converter.

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authorization = accessor.getNativeHeader("Authorization");
            if (authorization != null && !authorization.isEmpty()) {
                String bearerToken = authorization.get(0);
                if (bearerToken.startsWith("Bearer ")) {
                    String token = bearerToken.substring(7);
                    try {
                        Jwt jwt = jwtDecoder.decode(token);
                        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
                        Authentication authentication = converter.convert(jwt);
                        accessor.setUser(authentication);
                    } catch (Exception e) {
                        System.err.println("Failed to authenticate STOMP connection with JWT: " + e.getMessage());
                        throw new IllegalArgumentException("Invalid Token");
                    }
                }
            }
        }
        return message;
    }
}
