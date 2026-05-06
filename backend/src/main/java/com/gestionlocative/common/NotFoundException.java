package com.gestionlocative.common;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String entity, Object id) {
        super(entity + " introuvable : " + id);
    }
}
