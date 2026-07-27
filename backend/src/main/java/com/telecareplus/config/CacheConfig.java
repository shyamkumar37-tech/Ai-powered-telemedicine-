package com.telecareplus.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

// @Configuration
// @EnableCaching
public class CacheConfig {

    public static final String CACHE_SHORT = "short-ttl";
    public static final String CACHE_MEDIUM = "medium-ttl";
    public static final String CACHE_LONG = "long-ttl";

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> configMap = new HashMap<>();
        configMap.put(CACHE_SHORT, RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(1)));
        configMap.put(CACHE_MEDIUM, RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofHours(1)));
        configMap.put(CACHE_LONG, RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofDays(1)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(configMap)
                .build();
    }
}
