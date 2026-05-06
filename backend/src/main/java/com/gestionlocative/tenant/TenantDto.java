package com.gestionlocative.tenant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public class TenantDto {

    public record Request(
            @NotBlank(message = "Le nom est obligatoire") String lastName,
            @NotBlank(message = "Le prénom est obligatoire") String firstName,
            @Email(message = "Email invalide") String email,
            String phone,
            String notes
    ) {}

    public record Response(
            UUID id,
            String lastName,
            String firstName,
            String email,
            String phone,
            String notes
    ) {
        public static Response from(Tenant t) {
            return new Response(t.getId(), t.getLastName(), t.getFirstName(),
                    t.getEmail(), t.getPhone(), t.getNotes());
        }
    }
}
