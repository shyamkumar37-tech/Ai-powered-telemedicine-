package com.telecareplus.common;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(0)
@RequiredArgsConstructor
public class DatabaseCompatibilityUpdater implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        ensureUsersRoleConstraint();
    }

    private void ensureUsersRoleConstraint() {
        jdbcTemplate.execute("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
                        ALTER TABLE users DROP CONSTRAINT users_role_check;
                    END IF;

                    ALTER TABLE users
                        ADD CONSTRAINT users_role_check
                        CHECK (role IN ('PATIENT', 'DOCTOR', 'CAREGIVER', 'PHARMACIST', 'ADMIN'));
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END $$;
                """);
    }
}
