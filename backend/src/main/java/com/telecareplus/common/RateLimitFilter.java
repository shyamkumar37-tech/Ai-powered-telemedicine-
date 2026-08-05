package com.telecareplus.common;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.function.Supplier;

/**
 * Servlet filter that enforces per-IP rate limiting via Bucket4j + Redis
 * (Lettuce-based proxy manager).
 *
 * <p>Limits: 100 requests / 60 seconds per remote IP address.
 * Buckets are stored in Redis and expire automatically 10 seconds after
 * the refill window via {@link RedisBucket4jConfig}.
 *
 * <p>Paths excluded from auth (e.g. /actuator/health) still pass through
 * the rate limiter so that health-check hammering is also throttled at the
 * network edge.
 */
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final LettuceBasedProxyManager<byte[]> proxyManager;

    /** Supplier is lazy so the configuration is built only once per bucket. */
    private static final Supplier<BucketConfiguration> BUCKET_CONFIG = () ->
            BucketConfiguration.builder()
                    .addLimit(Bandwidth.builder()
                            .capacity(100)
                            .refillGreedy(100, Duration.ofMinutes(1))
                            .build())
                    .build();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String ip = resolveClientIp(request);
        Bucket bucket = proxyManager.builder().build(ip.getBytes(), BUCKET_CONFIG);

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"error\":\"Too many requests\",\"retryAfterSeconds\":60}");
        }
    }

    /**
     * Prefer the {@code X-Forwarded-For} header so that the real client IP
     * is used when the application runs behind a reverse proxy / load balancer.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // XFF may contain a comma-separated list; first entry is the origin
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
