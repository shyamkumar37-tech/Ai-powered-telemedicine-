package com.telecareplus.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.telecareplus.entity.enums.RoleType;

import lombok.Getter;

@Getter
public class CustomUserPrincipal implements UserDetails {

    private final Long userId;
    private final Long profileId;
    private final String username;
    private final String password;
    private final RoleType role;
    private final String fullName;
    private final String phone;
    private final String preferredLanguage;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserPrincipal(Long userId, String username, String password, RoleType role, boolean active) {
        this(userId, null, username, password, role, null, null, null, active);
    }

    public CustomUserPrincipal(Long userId, Long profileId, String username, String password, RoleType role, boolean active) {
        this(userId, profileId, username, password, role, null, null, null, active);
    }

    public CustomUserPrincipal(Long userId, String username, String password, RoleType role, String fullName, String phone, String preferredLanguage, boolean active) {
        this(userId, null, username, password, role, fullName, phone, preferredLanguage, active);
    }

    public CustomUserPrincipal(Long userId, Long profileId, String username, String password, RoleType role, String fullName, String phone, String preferredLanguage, boolean active) {
        this.userId = userId;
        this.profileId = profileId;
        this.username = username;
        this.password = password;
        this.role = role;
        this.fullName = fullName;
        this.phone = phone;
        this.preferredLanguage = preferredLanguage;
        this.active = active;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    public Long getProfileId() {
        return profileId;
    }
    
    public Long getUserId() { return userId; }
    public RoleType getRole() { return role; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
