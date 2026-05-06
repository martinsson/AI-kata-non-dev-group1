package com.gestionlocative.charge;

import com.gestionlocative.apartment.Apartment;
import com.gestionlocative.apartment.ApartmentRepository;
import com.gestionlocative.common.NotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/charges")
public class ChargeController {

    private final ChargeRepository charges;
    private final ApartmentRepository apartments;

    public ChargeController(ChargeRepository charges, ApartmentRepository apartments) {
        this.charges = charges;
        this.apartments = apartments;
    }

    @GetMapping
    public List<ChargeDto.Response> list(@RequestParam(required = false) UUID apartmentId) {
        List<Charge> rows = apartmentId != null ? charges.findByApartmentId(apartmentId) : charges.findAll();
        return rows.stream()
                .sorted(Comparator.comparing(Charge::getDate).reversed())
                .map(ChargeDto.Response::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ChargeDto.Response get(@PathVariable UUID id) {
        return ChargeDto.Response.from(load(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChargeDto.Response create(@Valid @RequestBody ChargeDto.Request req) {
        Charge c = new Charge();
        c.setId(UUID.randomUUID());
        c.setApartment(loadApartment(req.apartmentId()));
        c.setDate(req.date());
        c.setAmount(req.amount());
        c.setCategory(req.category());
        c.setLabel(req.label());
        c.setCreatedAt(Instant.now());
        return ChargeDto.Response.from(charges.save(c));
    }

    @PutMapping("/{id}")
    public ChargeDto.Response update(@PathVariable UUID id, @Valid @RequestBody ChargeDto.Request req) {
        Charge c = load(id);
        c.setApartment(loadApartment(req.apartmentId()));
        c.setDate(req.date());
        c.setAmount(req.amount());
        c.setCategory(req.category());
        c.setLabel(req.label());
        return ChargeDto.Response.from(charges.save(c));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        if (!charges.existsById(id)) throw new NotFoundException("Charge", id);
        charges.deleteById(id);
    }

    private Charge load(UUID id) {
        return charges.findById(id).orElseThrow(() -> new NotFoundException("Charge", id));
    }

    private Apartment loadApartment(UUID id) {
        return apartments.findById(id).orElseThrow(() -> new NotFoundException("Appartement", id));
    }
}
