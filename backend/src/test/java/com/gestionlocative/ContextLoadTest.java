package com.gestionlocative;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ContextLoadTest {

    @Test
    void contextLoads() {
        // Vérifie que la configuration Spring se charge correctement.
    }
}
