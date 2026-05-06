package com.gestionlocative.payment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class PaymentDto {

    public record Request(
            @NotNull(message = "La location est obligatoire") UUID leaseId,
            @NotNull(message = "La date est obligatoire") LocalDate date,
            @NotNull(message = "Le montant est obligatoire")
            @PositiveOrZero(message = "Le montant doit être positif") BigDecimal amount,
            @NotNull(message = "Le type est obligatoire") PaymentType type,
            @NotNull(message = "Le statut est obligatoire") PaymentStatus status,
            String note
    ) {}

    public record Response(
            UUID id,
            UUID leaseId,
            String leaseLabel,
            LocalDate date,
            BigDecimal amount,
            PaymentType type,
            PaymentStatus status,
            String note
    ) {
        public static Response from(Payment p) {
            String label;
            try {
                String aptName = p.getLease().getApartment().getName();
                String tenName = (p.getLease().getTenant().getFirstName() + " "
                        + p.getLease().getTenant().getLastName()).trim();
                label = aptName + " — " + tenName;
            } catch (Exception e) {
                label = "—";
            }
            return new Response(
                    p.getId(), p.getLease().getId(), label,
                    p.getDate(), p.getAmount(),
                    p.getType(), p.getStatus(), p.getNote()
            );
        }
    }

    public record GenerationResult(int generated, String month) {}
}
