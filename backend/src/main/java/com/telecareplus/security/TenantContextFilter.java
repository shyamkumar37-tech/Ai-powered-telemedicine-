package com.telecareplus.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class TenantContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Extract tenant ID from HTTP Header X-Tenant-ID
        String tenantId = request.getHeader("X-Tenant-ID");
        
        // Alternatively extract from subdomain (e.g. acme.telecareplus.com -> acme)
        if (tenantId == null || tenantId.isEmpty()) {
            String serverName = request.getServerName();
            if (serverName != null && serverName.contains(".")) {
                String potentialTenant = serverName.split("\\.")[0];
                if (!potentialTenant.equals("www") && !potentialTenant.equals("localhost") && !potentialTenant.equals("api")) {
                    tenantId = potentialTenant;
                }
            }
        }
        
        if (tenantId != null && !tenantId.isEmpty()) {
            TenantContext.setCurrentTenant(tenantId);
        } else {
            TenantContext.setCurrentTenant(TenantContext.DEFAULT_TENANT);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
