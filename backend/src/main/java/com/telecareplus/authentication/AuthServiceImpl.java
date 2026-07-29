package com.telecareplus.authentication;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.telecareplus.common.AppProperties;
import com.telecareplus.authentication.AuthDtos;
import com.telecareplus.users.Caregiver;
import com.telecareplus.users.Doctor;
import com.telecareplus.authentication.LoginOtp;
import com.telecareplus.users.Patient;
import com.telecareplus.users.Pharmacist;
import com.telecareplus.users.User;
import com.telecareplus.common.RoleType;
import com.telecareplus.common.BadRequestException;
import com.telecareplus.users.CaregiverRepository;
import com.telecareplus.users.DoctorRepository;
import com.telecareplus.authentication.LoginOtpRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.users.PharmacistRepository;
import com.telecareplus.users.UserRepository;
import com.telecareplus.users.CustomUserPrincipal;
import com.telecareplus.authentication.JwtService;
import com.telecareplus.authentication.AuthService;
import com.telecareplus.communication.CommunicationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CaregiverRepository caregiverRepository;
    private final PharmacistRepository pharmacistRepository;
    private final LoginOtpRepository loginOtpRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CommunicationService communicationService;
    private final AppProperties appProperties;
    private final Map<String, OtpAttemptState> otpAttemptStates = new ConcurrentHashMap<>();

    @Override
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already registered");
        }
        if (userRepository.existsByPhone(request.phone())) {
            throw new BadRequestException("Mobile number already registered");
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setRole(request.role());
        user.setPreferredLanguage("en"); // Or default
        user = userRepository.save(user);

        Boolean isProfileComplete = resolveIsProfileComplete(user.getId(), user.getRole());

        Long profileId = null;
        if (request.role() == RoleType.PATIENT) {
            Patient patient = new Patient();
            patient.setUser(user);
            patient.setGender("Unknown");
            patient = patientRepository.save(patient);
            profileId = patient.getId();
            isProfileComplete = patient.isProfileComplete();
        } else if (request.role() == RoleType.DOCTOR) {
            Doctor doctor = new Doctor();
            doctor.setUser(user);
            doctor.setSpecialization("General Medicine");
            doctor.setExperienceYears(5);
            doctor.setConsultationFee(new BigDecimal("500.00"));
            doctor = doctorRepository.save(doctor);
            profileId = doctor.getId();
        } else if (request.role() == RoleType.CAREGIVER) {
            Caregiver caregiver = new Caregiver();
            caregiver.setUser(user);
            caregiver = caregiverRepository.save(caregiver);
            profileId = caregiver.getId();
        } else if (request.role() == RoleType.PHARMACIST) {
            Pharmacist pharmacist = new Pharmacist();
            pharmacist.setUser(user);
            pharmacist.setFacilityName("TeleCare+ Pharmacy");
            pharmacist.setLicenseNumber("PHARM-" + user.getId());
            pharmacist.setShiftSummary("Daily 09:00-18:00");
            pharmacist = pharmacistRepository.save(pharmacist);
            profileId = pharmacist.getId();
        }

        return new AuthDtos.AuthResponse(
                jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name(), profileId),
                user.getId(),
                profileId,
                user.getRole(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                new AuthDtos.UserSummary(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getRole(),
                        user.getPreferredLanguage()
                ),
                isProfileComplete
        );
    }

    @Override
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        Long profileId = resolveProfileId(principal.getUserId(), principal.getRole());
        Boolean isProfileComplete = resolveIsProfileComplete(principal.getUserId(), principal.getRole());
        return new AuthDtos.AuthResponse(
                jwtService.generateToken(principal.getUserId(), principal.getUsername(), principal.getRole().name(), profileId),
                principal.getUserId(),
                profileId,
                principal.getRole(),
                principal.getFullName(),
                principal.getUsername(),
                principal.getPhone(),
                new AuthDtos.UserSummary(
                        principal.getUserId(),
                        principal.getFullName(),
                        principal.getUsername(),
                        principal.getPhone(),
                        principal.getRole(),
                        principal.getPreferredLanguage()
                ),
                isProfileComplete
        );
    }

    @Override
    public AuthDtos.OtpSendResponse requestLoginOtp(AuthDtos.OtpRequest request) {
        User user = userRepository.findByPhone(request.phone())
                .orElseThrow(() -> new BadRequestException("Mobile number not registered"));

        enforceOtpCooldown(user.getPhone());
        enforceOtpRequestWindow(user.getPhone());

        LoginOtp loginOtp = new LoginOtp();
        loginOtp.setPhone(user.getPhone());
        loginOtp.setOtpCode(generateOtp());
        loginOtp.setExpiresAt(LocalDateTime.now().plusSeconds(appProperties.getAuth().getOtp().getTtlSeconds()));
        loginOtp.setUsed(false);
        loginOtpRepository.save(loginOtp);
        resetOtpAttempts(user.getPhone());

        var dispatch = communicationService.dispatchLoginOtp(user, loginOtp.getOtpCode(), appProperties.getAuth().getOtp().getTtlSeconds());
        return new AuthDtos.OtpSendResponse(
                dispatch.phone(),
                dispatch.message(),
                dispatch.expiresInSeconds()
        );
    }

    @Override
    public AuthDtos.AuthResponse verifyLoginOtp(AuthDtos.OtpVerifyRequest request) {
        User user = userRepository.findByPhone(request.phone())
                .orElseThrow(() -> new BadRequestException("Mobile number not registered"));

        LoginOtp loginOtp = loginOtpRepository.findTopByPhoneAndUsedFalseOrderByCreatedAtDesc(request.phone())
                .orElseThrow(() -> new BadRequestException("OTP not requested for this mobile number"));

        if (loginOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP expired. Request a new OTP.");
        }
        if (!loginOtp.getOtpCode().equals(request.otp())) {
            registerOtpFailure(user.getPhone(), loginOtp);
            throw new BadRequestException("Invalid OTP");
        }

        loginOtp.setUsed(true);
        loginOtpRepository.save(loginOtp);
        resetOtpAttempts(user.getPhone());

        Long profileId = resolveProfileId(user);
        Boolean isProfileComplete = resolveIsProfileComplete(user.getId(), user.getRole());

        return new AuthDtos.AuthResponse(
                jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name(), profileId),
                user.getId(),
                profileId,
                user.getRole(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                new AuthDtos.UserSummary(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getRole(),
                        user.getPreferredLanguage()
                ),
                isProfileComplete
        );
    }

    private String generateOtp() {
        return String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
    }

    private void enforceOtpCooldown(String phone) {
        LoginOtp latest = loginOtpRepository.findTopByPhoneAndUsedFalseOrderByCreatedAtDesc(phone).orElse(null);
        if (latest == null || latest.getCreatedAt() == null) {
            return;
        }

        long cooldownSeconds = appProperties.getAuth().getOtp().getResendCooldownSeconds();
        if (cooldownSeconds <= 0) {
            return;
        }

        if (latest.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(cooldownSeconds))) {
            throw new BadRequestException("Please wait before requesting another OTP.");
        }
    }

    private void enforceOtpRequestWindow(String phone) {
        OtpAttemptState state = otpAttemptStates.computeIfAbsent(phone, key -> new OtpAttemptState());
        long windowSeconds = appProperties.getAuth().getOtp().getRequestWindowSeconds();
        int maxRequests = appProperties.getAuth().getOtp().getMaxRequestsPerWindow();
        state.resetIfExpired(windowSeconds);
        if (state.requestCount >= maxRequests) {
            throw new BadRequestException("Too many OTP requests. Please try again later.");
        }
        state.requestCount += 1;
    }

    private void registerOtpFailure(String phone, LoginOtp loginOtp) {
        OtpAttemptState state = otpAttemptStates.computeIfAbsent(phone, key -> new OtpAttemptState());
        int maxAttempts = appProperties.getAuth().getOtp().getMaxAttempts();
        state.failedAttempts += 1;
        if (state.failedAttempts >= maxAttempts) {
            loginOtp.setUsed(true);
            loginOtpRepository.save(loginOtp);
            throw new BadRequestException("Too many invalid OTP attempts. Request a new OTP.");
        }
    }

    private void resetOtpAttempts(String phone) {
        otpAttemptStates.remove(phone);
    }

    private Long resolveProfileId(User user) {
        Objects.requireNonNull(user, "user must not be null");
        return resolveProfileId(user.getId(), user.getRole());
    }

    private Long resolveProfileId(Long userId, RoleType role) {
        return switch (role) {
            case PATIENT -> patientRepository.findByUserId(userId).map(Patient::getId).orElse(null);
            case DOCTOR -> doctorRepository.findByUserId(userId).map(Doctor::getId).orElse(null);
            case CAREGIVER -> caregiverRepository.findByUserId(userId).map(Caregiver::getId).orElse(null);
            case PHARMACIST -> pharmacistRepository.findByUserId(userId).map(Pharmacist::getId).orElse(null);
            default -> null;
        };
    }

    private Boolean resolveIsProfileComplete(Long userId, RoleType role) {
        if (role == RoleType.PATIENT) {
            return patientRepository.findByUserId(userId).map(Patient::isProfileComplete).orElse(false);
        }
        return true;
    }

    private static class OtpAttemptState {
        private int requestCount = 0;
        private int failedAttempts = 0;
        private LocalDateTime windowStart = LocalDateTime.now();

        void resetIfExpired(long windowSeconds) {
            if (windowSeconds <= 0) {
                return;
            }
            if (windowStart.isBefore(LocalDateTime.now().minusSeconds(windowSeconds))) {
                requestCount = 0;
                failedAttempts = 0;
                windowStart = LocalDateTime.now();
            }
        }
    }
}
