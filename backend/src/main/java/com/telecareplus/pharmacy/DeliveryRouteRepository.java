package com.telecareplus.pharmacy;

import com.telecareplus.pharmacy.DeliveryRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryRouteRepository extends JpaRepository<DeliveryRoute, Long> {}
