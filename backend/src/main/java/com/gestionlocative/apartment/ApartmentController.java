package com.gestionlocative.apartment;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/apartments")
public class ApartmentController {

    private final ApartmentRepository repository;

    public ApartmentController(ApartmentRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ApartmentDto.Response> list() {
        return repository.findAll().stream().map(ApartmentDto.Response::from).toList();
    }

    @GetMapping("/{id}")
    public ApartmentDto.Response get(@PathVariable UUID id) {
        return ApartmentDto.Response.from(load(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApartmentDto.Response create(@Valid @RequestBody ApartmentDto.Request req) {
        Apartment a = new Apartment(UUID.randomUUID(), req.name(), req.address(),
                req.surface(), req.rooms(), req.notes(), Instant.now());
        return ApartmentDto.Response.from(repository.save(a));
    }

    @PutMapping("/{id}")
    public ApartmentDto.Response update(@PathVariable UUID id, @Valid @RequestBody ApartmentDto.Request req) {
        Apartment a = load(id);
        a.setName(req.name());
        a.setAddress(req.address());
        a.setSurface(req.surface());
        a.setRooms(req.rooms());
        a.setNotes(req.notes());
        return ApartmentDto.Response.from(repository.save(a));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        if (!repository.existsById(id)) throw new NotFoundException("Appartement", id);
        repository.deleteById(id);
    }

    private Apartment load(UUID id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Appartement", id));
    }
}
