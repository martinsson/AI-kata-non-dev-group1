package com.gestionlocative.charge;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class ChargeDto {

    public record Request(
            @NotNull(message = "L'appartement est obligatoire") UUID apartmentId,
            @NotNull(message = "La date est obligatoire") LocalDate date,
            @NotNull(message = "Le montant est obligatoire")
            @PositiveOrZero(message = "Le montant doit être positif") BigDecimal amount,
            @NotBlank(message = "La catégorie est obligatoire") String category,
            String label
    ) {}

    public record Response(
            UUID id,
            UUID apartmentId,
            String apartmentName,
            LocalDate date,
            BigDecimal amount,
            String category,
            String label
    ) {
        public static Response from(Charge c) {
            return new Response(
                    c.getId(), c.getApartment().getId(), c.getApartment().getName(),
                    c.getDate(), c.getAmount(), c.getCategory(), c.getLabel()
            );
        }
    }
}
