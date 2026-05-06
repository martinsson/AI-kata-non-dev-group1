package com.gestionlocative.charge;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ChargeRepository extends JpaRepository<Charge, UUID> {

    List<Charge> findByApartmentId(UUID apartmentId);

    @Query("select coalesce(sum(c.amount), 0) from Charge c where c.date >= :since")
    BigDecimal sumSince(LocalDate since);
}
