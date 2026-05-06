package com.gestionlocative.dashboard;

import com.gestionlocative.apartment.ApartmentRepository;
import com.gestionlocative.charge.ChargeRepository;
import com.gestionlocative.lease.Lease;
import com.gestionlocative.lease.LeaseRepository;
import com.gestionlocative.payment.PaymentRepository;
import com.gestionlocative.payment.PaymentStatus;
import com.gestionlocative.tenant.TenantRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ApartmentRepository apartments;
    private final TenantRepository tenants;
    private final LeaseRepository leases;
    private final PaymentRepository payments;
    private final ChargeRepository charges;

    public DashboardController(ApartmentRepository apartments, TenantRepository tenants,
                               LeaseRepository leases, PaymentRepository payments,
                               ChargeRepository charges) {
        this.apartments = apartments;
        this.tenants = tenants;
        this.leases = leases;
        this.payments = payments;
        this.charges = charges;
    }

    public record Stats(
            long apartments,
            long tenants,
            long activeLeases,
            BigDecimal monthlyRent,
            BigDecimal unpaid,
            BigDecimal yearCharges
    ) {}

    @GetMapping("/stats")
    public Stats stats() {
        LocalDate today = LocalDate.now();
        List<Lease> active = leases.findActive(today);
        BigDecimal monthlyRent = active.stream()
                .map(l -> l.getMonthlyRent().add(l.getMonthlyCharges() != null ? l.getMonthlyCharges() : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal unpaid = payments.sumByStatus(PaymentStatus.PENDING);
        BigDecimal yearCharges = charges.sumSince(today.minusYears(1));
        return new Stats(
                apartments.count(),
                tenants.count(),
                active.size(),
                monthlyRent,
                unpaid != null ? unpaid : BigDecimal.ZERO,
                yearCharges != null ? yearCharges : BigDecimal.ZERO
        );
    }
}
