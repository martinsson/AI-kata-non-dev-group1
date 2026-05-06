package com.gestionlocative.payment;

import com.gestionlocative.common.NotFoundException;
import com.gestionlocative.lease.Lease;
import com.gestionlocative.lease.LeaseRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentRepository payments;
    private final LeaseRepository leases;

    public PaymentController(PaymentRepository payments, LeaseRepository leases) {
        this.payments = payments;
        this.leases = leases;
    }

    @GetMapping
    public List<PaymentDto.Response> list(@RequestParam(required = false) UUID leaseId,
                                          @RequestParam(required = false) PaymentStatus status) {
        List<Payment> rows;
        if (leaseId != null) rows = payments.findByLeaseId(leaseId);
        else if (status != null) rows = payments.findByStatus(status);
        else rows = payments.findAll();

        if (leaseId != null && status != null) {
            rows = rows.stream().filter(p -> p.getStatus() == status).toList();
        }
        return rows.stream()
                .sorted(Comparator.comparing(Payment::getDate).reversed())
                .map(PaymentDto.Response::from)
                .toList();
    }

    @GetMapping("/{id}")
    public PaymentDto.Response get(@PathVariable UUID id) {
        return PaymentDto.Response.from(load(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentDto.Response create(@Valid @RequestBody PaymentDto.Request req) {
        Payment p = new Payment();
        p.setId(UUID.randomUUID());
        p.setLease(loadLease(req.leaseId()));
        p.setDate(req.date());
        p.setAmount(req.amount());
        p.setType(req.type());
        p.setStatus(req.status());
        p.setNote(req.note());
        p.setCreatedAt(Instant.now());
        return PaymentDto.Response.from(payments.save(p));
    }

    @PutMapping("/{id}")
    public PaymentDto.Response update(@PathVariable UUID id, @Valid @RequestBody PaymentDto.Request req) {
        Payment p = load(id);
        p.setLease(loadLease(req.leaseId()));
        p.setDate(req.date());
        p.setAmount(req.amount());
        p.setType(req.type());
        p.setStatus(req.status());
        p.setNote(req.note());
        return PaymentDto.Response.from(payments.save(p));
    }

    @PatchMapping("/{id}/mark-paid")
    public PaymentDto.Response markPaid(@PathVariable UUID id) {
        Payment p = load(id);
        p.setStatus(PaymentStatus.PAID);
        return PaymentDto.Response.from(payments.save(p));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        if (!payments.existsById(id)) throw new NotFoundException("Paiement", id);
        payments.deleteById(id);
    }

    @PostMapping("/generate-current-month")
    public PaymentDto.GenerationResult generate() {
        LocalDate today = LocalDate.now();
        YearMonth month = YearMonth.from(today);
        LocalDate start = month.atDay(1);
        LocalDate next = month.plusMonths(1).atDay(1);
        int generated = 0;
        for (Lease l : leases.findActive(today)) {
            if (l.getMonthlyRent() == null || l.getMonthlyRent().signum() == 0) continue;
            if (payments.existsForLeaseTypeAndMonth(l.getId(), PaymentType.RENT, start, next)) continue;
            BigDecimal amount = l.getMonthlyRent().add(l.getMonthlyCharges() != null ? l.getMonthlyCharges() : BigDecimal.ZERO);
            Payment p = new Payment();
            p.setId(UUID.randomUUID());
            p.setLease(l);
            p.setDate(month.atDay(Math.min(5, month.lengthOfMonth())));
            p.setAmount(amount);
            p.setType(PaymentType.RENT);
            p.setStatus(PaymentStatus.PENDING);
            p.setNote("Généré automatiquement");
            p.setCreatedAt(Instant.now());
            payments.save(p);
            generated++;
        }
        return new PaymentDto.GenerationResult(generated, month.toString());
    }

    private Payment load(UUID id) {
        return payments.findById(id).orElseThrow(() -> new NotFoundException("Paiement", id));
    }

    private Lease loadLease(UUID id) {
        return leases.findById(id).orElseThrow(() -> new NotFoundException("Location", id));
    }
}
