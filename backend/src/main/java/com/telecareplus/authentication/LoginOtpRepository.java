package com.telecareplus.authentication;

import com.telecareplus.authentication.LoginOtp;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginOtpRepository extends JpaRepository<LoginOtp, Long> {
    Optional<LoginOtp> findTopByPhoneAndUsedFalseOrderByCreatedAtDesc(String phone);
}
