package com.nancyimmo.bailleur.services;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.nancyimmo.bailleur.dto.DueMonthDto;

class PortalServiceDuesTest {

    private final PortalService service =
            new PortalService(null, null, null, null, null, null); // 6 dépendances, inutilisées ici
    private static final BigDecimal LOYER = new BigDecimal("750.00");
    private static final YearMonth MAINTENANT = YearMonth.of(2026, 3);

    @Test
    @DisplayName("Trois mois d'arriérés sont marqués LATE et le mois courant CURRENT")
    void calcule_les_arrieres_et_le_mois_courant() {
        List<DueMonthDto> dues = service.computeDues(
                LocalDate.of(2025, 12, 1), null, LOYER, Set.of(), MAINTENANT);

        assertEquals(4, dues.size());                       // déc, jan, fév, mars
        assertEquals("LATE", dues.get(0).getStatus());
        assertEquals("CURRENT", dues.get(3).getStatus());   // mars = mois courant
    }

    @Test
    @DisplayName("Un mois déjà réglé est exclu des sommes dues")
    void exclut_les_mois_deja_payes() {
        List<DueMonthDto> dues = service.computeDues(
                LocalDate.of(2026, 1, 1), null, LOYER,
                Set.of(YearMonth.of(2026, 2)), MAINTENANT);

        assertEquals(2, dues.size());                       // janvier + mars (février payé)
    }

    @Test
    @DisplayName("Un loyer nul ou négatif ne génère aucune échéance")
    void ignore_un_loyer_invalide() {
        assertTrue(service.computeDues(
                LocalDate.of(2026, 1, 1), null, BigDecimal.ZERO, Set.of(), MAINTENANT).isEmpty());
    }

    @Test
    @DisplayName("Un bail terminé ne génère pas d'échéance au-delà de sa date de fin")
    void s_arrete_a_la_fin_du_bail() {
        List<DueMonthDto> dues = service.computeDues(
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 28), LOYER, Set.of(), MAINTENANT);

        assertEquals(2, dues.size());                       // janvier + février seulement
    }
}