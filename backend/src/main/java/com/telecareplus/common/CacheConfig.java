package com.telecareplus.common;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis-backed Spring Cache configuration with per-cache TTLs aligned
 * to the approved production configuration:
 * <ul>
 *   <li>dashboard       – 5 minutes</li>
 *   <li>analytics       – 15 minutes</li>
 *   <li>doctorSlots     – 2 minutes</li>
 *   <li>appConfig       – 1 hour</li>
 * </ul>
 *
 * Serialization uses {@link GenericJackson2JsonRedisSerializer} with full
 * Java-time support so that LocalDate / LocalDateTime round-trip correctly.
 * Null values are never cached to prevent stale-empty entries.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    // ── Cache name constants ──────────────────────────────────────────────────
    public static final String CACHE_DASHBOARD         = "dashboard";
    public static final String CACHE_ANALYTICS         = "analytics";
    public static final String CACHE_DOCTOR_SLOTS      = "doctorSlots";
    public static final String CACHE_APP_CONFIG        = "appConfig";

    // ── Legacy generic TTL constants (kept for backward compat) ───────────────
    public static final String CACHE_SHORT  = "short-ttl";
    public static final String CACHE_MEDIUM = "medium-ttl";
    public static final String CACHE_LONG   = "long-ttl";

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Shared Jackson {@link ObjectMapper} configured for Redis serialization.
     * Uses activateDefaultTyping so that polymorphic types survive JSON
     * round-trips without additional type hints in each DTO.
     */
    private ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
        return mapper;
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {

        GenericJackson2JsonRedisSerializer valueSerializer =
                new GenericJackson2JsonRedisSerializer(redisObjectMapper());

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration
                .defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))          // safe default
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext
                        .SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext
                        .SerializationPair.fromSerializer(valueSerializer));

        Map<String, RedisCacheConfiguration> perCacheConfig = new HashMap<>();

        // ── Approved production TTLs ──────────────────────────────────────────
        perCacheConfig.put(CACHE_DASHBOARD,
                defaultConfig.entryTtl(Duration.ofMinutes(5)));
        perCacheConfig.put(CACHE_ANALYTICS,
                defaultConfig.entryTtl(Duration.ofMinutes(15)));
        perCacheConfig.put(CACHE_DOCTOR_SLOTS,
                defaultConfig.entryTtl(Duration.ofMinutes(2)));
        perCacheConfig.put(CACHE_APP_CONFIG,
                defaultConfig.entryTtl(Duration.ofHours(1)));

        // ── Legacy generic TTL caches ─────────────────────────────────────────
        perCacheConfig.put(CACHE_SHORT,
                defaultConfig.entryTtl(Duration.ofMinutes(1)));
        perCacheConfig.put(CACHE_MEDIUM,
                defaultConfig.entryTtl(Duration.ofHours(1)));
        perCacheConfig.put(CACHE_LONG,
                defaultConfig.entryTtl(Duration.ofDays(1)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(perCacheConfig)
                .transactionAware()
                .build();
    }
}
