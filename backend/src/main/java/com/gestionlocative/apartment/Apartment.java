package com.gestionlocative.apartment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "apartment")
public class Apartment {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String address;

    private BigDecimal surface;

    private Integer rooms;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Apartment() { }

    public Apartment(UUID id, String name, String address, BigDecimal surface,
                     Integer rooms, String notes, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.surface = surface;
        this.rooms = rooms;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public BigDecimal getSurface() { return surface; }
    public void setSurface(BigDecimal surface) { this.surface = surface; }

    public Integer getRooms() { return rooms; }
    public void setRooms(Integer rooms) { this.rooms = rooms; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
