package com.telecareplus.clinical;

import com.telecareplus.clinical.FallEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FallEventRepository extends JpaRepository<FallEvent, Long> {}
