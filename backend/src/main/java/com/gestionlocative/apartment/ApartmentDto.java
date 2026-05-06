package com.gestionlocative.apartment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.UUID;

public class ApartmentDto {

    public record Request(
            @NotBlank(message = "Le nom est obligatoire") String name,
            String address,
            @PositiveOrZero(message = "La surface doit être positive") BigDecimal surface,
            @PositiveOrZero(message = "Le nombre de pièces doit être positif") Integer rooms,
            String notes
    ) {}

    public record Response(
            UUID id,
            String name,
            String address,
            BigDecimal surface,
            Integer rooms,
            String notes
    ) {
        public static Response from(Apartment a) {
            return new Response(a.getId(), a.getName(), a.getAddress(),
                    a.getSurface(), a.getRooms(), a.getNotes());
        }
    }
}
