package com.gestionlocative.lease;

import com.gestionlocative.apartment.Apartment;
import com.gestionlocative.apartment.ApartmentRepository;
import com.gestionlocative.common.NotFoundException;
import com.gestionlocative.tenant.Tenant;
import com.gestionlocative.tenant.TenantRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leases")
public class LeaseController {

    private final LeaseRepository leases;
    private final ApartmentRepository apartments;
    private final TenantRepository tenants;

    public LeaseController(LeaseRepository leases, ApartmentRepository apartments, TenantRepository tenants) {
        this.leases = leases;
        this.apartments = apartments;
        this.tenants = tenants;
    }

    @GetMapping
    public List<LeaseDto.Response> list() {
        LocalDate today = LocalDate.now();
        return leases.findAll().stream().map(l -> LeaseDto.Response.from(l, today)).toList();
    }

    @GetMapping("/{id}")
    public LeaseDto.Response get(@PathVariable UUID id) {
        return LeaseDto.Response.from(load(id), LocalDate.now());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeaseDto.Response create(@Valid @RequestBody LeaseDto.Request req) {
        validateDates(req.startDate(), req.endDate());
        Lease l = new Lease();
        l.setId(UUID.randomUUID());
        l.setApartment(loadApartment(req.apartmentId()));
        l.setTenant(loadTenant(req.tenantId()));
        l.setStartDate(req.startDate());
        l.setEndDate(req.endDate());
        l.setMonthlyRent(req.monthlyRent());
        l.setMonthlyCharges(req.monthlyCharges() != null ? req.monthlyCharges() : BigDecimal.ZERO);
        l.setDeposit(req.deposit());
        l.setCreatedAt(Instant.now());
        return LeaseDto.Response.from(leases.save(l), LocalDate.now());
    }

    @PutMapping("/{id}")
    public LeaseDto.Response update(@PathVariable UUID id, @Valid @RequestBody LeaseDto.Request req) {
        validateDates(req.startDate(), req.endDate());
        Lease l = load(id);
        l.setApartment(loadApartment(req.apartmentId()));
        l.setTenant(loadTenant(req.tenantId()));
        l.setStartDate(req.startDate());
        l.setEndDate(req.endDate());
        l.setMonthlyRent(req.monthlyRent());
        l.setMonthlyCharges(req.monthlyCharges() != null ? req.monthlyCharges() : BigDecimal.ZERO);
        l.setDeposit(req.deposit());
        return LeaseDto.Response.from(leases.save(l), LocalDate.now());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        if (!leases.existsById(id)) throw new NotFoundException("Location", id);
        leases.deleteById(id);
    }

    private Lease load(UUID id) {
        return leases.findById(id).orElseThrow(() -> new NotFoundException("Location", id));
    }

    private Apartment loadApartment(UUID id) {
        return apartments.findById(id).orElseThrow(() -> new NotFoundException("Appartement", id));
    }

    private Tenant loadTenant(UUID id) {
        return tenants.findById(id).orElseThrow(() -> new NotFoundException("Locataire", id));
    }

    private void validateDates(LocalDate start, LocalDate end) {
        if (end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("La date de fin doit être postérieure à la date de début");
        }
    }
}
