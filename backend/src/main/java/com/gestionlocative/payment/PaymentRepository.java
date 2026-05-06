package com.gestionlocative.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByStatus(PaymentStatus status);

    List<Payment> findByLeaseId(UUID leaseId);

    @Query("""
            select count(p) > 0 from Payment p
            where p.lease.id = :leaseId
              and p.type = :type
              and p.date >= :start and p.date < :endExclusive
            """)
    boolean existsForLeaseTypeAndMonth(UUID leaseId, PaymentType type, LocalDate start, LocalDate endExclusive);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = :status")
    BigDecimal sumByStatus(PaymentStatus status);
}
