package com.gestionlocative.tenant;

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
@RequestMapping("/api/tenants")
public class TenantController {

    private final TenantRepository repository;

    public TenantController(TenantRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<TenantDto.Response> list() {
        return repository.findAll().stream().map(TenantDto.Response::from).toList();
    }

    @GetMapping("/{id}")
    public TenantDto.Response get(@PathVariable UUID id) {
        return TenantDto.Response.from(load(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TenantDto.Response create(@Valid @RequestBody TenantDto.Request req) {
        Tenant t = new Tenant(UUID.randomUUID(), req.lastName(), req.firstName(),
                req.email(), req.phone(), req.notes(), Instant.now());
        return TenantDto.Response.from(repository.save(t));
    }

    @PutMapping("/{id}")
    public TenantDto.Response update(@PathVariable UUID id, @Valid @RequestBody TenantDto.Request req) {
        Tenant t = load(id);
        t.setLastName(req.lastName());
        t.setFirstName(req.firstName());
        t.setEmail(req.email());
        t.setPhone(req.phone());
        t.setNotes(req.notes());
        return TenantDto.Response.from(repository.save(t));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        if (!repository.existsById(id)) throw new NotFoundException("Locataire", id);
        repository.deleteById(id);
    }

    private Tenant load(UUID id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Locataire", id));
    }
}
