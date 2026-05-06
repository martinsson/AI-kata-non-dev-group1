package com.gestionlocative.lease;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class LeaseDto {

    public record Request(
            @NotNull(message = "L'appartement est obligatoire") UUID apartmentId,
            @NotNull(message = "Le locataire est obligatoire") UUID tenantId,
            @NotNull(message = "La date de début est obligatoire") LocalDate startDate,
            LocalDate endDate,
            @NotNull(message = "Le loyer mensuel est obligatoire")
            @PositiveOrZero(message = "Le loyer doit être positif") BigDecimal monthlyRent,
            @PositiveOrZero(message = "Les charges doivent être positives") BigDecimal monthlyCharges,
            @PositiveOrZero(message = "Le dépôt doit être positif") BigDecimal deposit
    ) {}

    public record Response(
            UUID id,
            UUID apartmentId,
            String apartmentName,
            UUID tenantId,
            String tenantFullName,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal monthlyRent,
            BigDecimal monthlyCharges,
            BigDecimal deposit,
            String status
    ) {
        public static Response from(Lease l, LocalDate today) {
            String status = l.isActive(today) ? "ACTIVE" : "ENDED";
            String tenantName = (l.getTenant().getFirstName() + " " + l.getTenant().getLastName()).trim();
            return new Response(
                    l.getId(),
                    l.getApartment().getId(), l.getApartment().getName(),
                    l.getTenant().getId(), tenantName,
                    l.getStartDate(), l.getEndDate(),
                    l.getMonthlyRent(), l.getMonthlyCharges(), l.getDeposit(),
                    status
            );
        }
    }
}
