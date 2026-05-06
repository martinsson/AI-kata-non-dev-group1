package com.gestionlocative.lease;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface LeaseRepository extends JpaRepository<Lease, UUID> {

    default List<Lease> findActive(LocalDate today) {
        return findAll().stream().filter(l -> l.isActive(today)).toList();
    }
}
