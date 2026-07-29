package com.telecareplus.authentication;

import com.telecareplus.users.CustomUserPrincipal;
import com.telecareplus.common.RoleType;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

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
                        if (jwtService.isValid(token)) {
                            Long userId = jwtService.extractUserId(token);
                            Long profileId = jwtService.extractProfileId(token);
                            String username = jwtService.extractUsername(token);
                            RoleType role = jwtService.extractRole(token);
                            
                            if (userId != null && username != null && role != null) {
                                CustomUserPrincipal principal = new CustomUserPrincipal(userId, profileId, username, "", role, true);
                                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                                accessor.setUser(authentication);
                            }
                        }
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
