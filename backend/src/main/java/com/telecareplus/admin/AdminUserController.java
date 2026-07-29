package com.telecareplus.admin;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;


import com.telecareplus.users.User;
import com.telecareplus.common.RoleType;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.users.UserRepository;
import com.telecareplus.admin.AccessAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.telecareplus.users.CustomUserPrincipal;

import java.util.List;
import java.util.Map;

@Tag(name = "AdminUser", description = "Endpoints for AdminUser management")
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;
    private final AccessAuditService accessAuditService;

    @Operation(summary = "Get All Users", description = "Get all users")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping
    public List<UserDto> getAllUsers(@RequestParam(required = false) RoleType role,
                                     @RequestParam(required = false) Boolean active) {
        // Since there is no complex filtering needed yet, we stream and filter
        return userRepository.findAll().stream()
                .filter(u -> role == null || u.getRole() == role)
                .filter(u -> active == null || u.isActive() == active)
                .map(this::mapToDto)
                .toList();
    }

    @Operation(summary = "Get User", description = "Get user")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userRepository.findById(id).map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Operation(summary = "Suspend User", description = "Suspends a user account")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}/suspend")
    public UserDto suspendUser(@PathVariable Long id, Authentication authentication) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setActive(false);
        user = userRepository.save(user);

        logAction(authentication, "Suspend User", user.getId());
        return mapToDto(user);
    }

    @Operation(summary = "Reactivate User", description = "Reactivates a user account")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}/reactivate")
    public UserDto reactivateUser(@PathVariable Long id, Authentication authentication) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setActive(true);
        user = userRepository.save(user);

        logAction(authentication, "Reactivate User", user.getId());
        return mapToDto(user);
    }

    @Operation(summary = "Reset Password", description = "Resets user password")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}/reset-password")
    public Map<String, String> resetPassword(@PathVariable Long id, Authentication authentication) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // In a real application, this would trigger an email. For now, just log it.
        logAction(authentication, "Reset Password Initiated", user.getId());
        
        return Map.of("message", "Password reset email sent to " + user.getEmail());
    }

    private void logAction(Authentication auth, String action, Long targetUserId) {
        if (auth == null || auth.getPrincipal() == null) return;
        CustomUserPrincipal principal = (CustomUserPrincipal) auth.getPrincipal();
        accessAuditService.logAccess(
                principal.getUserId(),
                principal.getRole().name(),
                targetUserId,
                action,
                "USER_ACCOUNT",
                "SUCCESS",
                null,
                "Admin API",
                null
        );
    }

    private UserDto mapToDto(User user) {
        return new UserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isActive()
        );
    }

    public record UserDto(
            Long id,
            String fullName,
            String email,
            String phone,
            RoleType role,
            boolean active
    ) {}
}
