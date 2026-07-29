package com.telecareplus.authentication;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket & STOMP Message Broker Configuration.
 * 
 * Local / Single-Node Profile:
 * Uses Spring's built-in in-memory SimpleBroker for local development.
 * 
 * Multi-Pod Production Extension Point:
 * In horizontally autoscaled Kubernetes deployments (multi-pod), replace simple broker
 * with an external STOMP Broker Relay (e.g., RabbitMQ or ActiveMQ STOMP plugin):
 * <code>
 * config.enableStompBrokerRelay("/topic", "/queue")
 *       .setRelayHost("rabbitmq-service")
 *       .setRelayPort(61613);
 * </code>
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // In-Memory SimpleBroker for local development & single-pod deployment
        config.enableSimpleBroker("/topic", "/queue", "/topic/vitals", "/topic/delivery");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/api/ws-telecare")
                .setAllowedOriginPatterns("*")
                .withSockJS();
                
        registry.addEndpoint("/ws/webrtc")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthInterceptor);
    }
}
