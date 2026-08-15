package com.nancyimmo.bailleur.services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nancyimmo.bailleur.dto.DueMonthDto;
import com.nancyimmo.bailleur.dto.PropertyDetailsDto;
import com.nancyimmo.bailleur.dto.StatementLineDto;
import com.nancyimmo.bailleur.models.LeaseModel;
import com.nancyimmo.bailleur.repositories.LeaseRepository;
import com.nancyimmo.bailleur.repositories.PaymentRepository;
import com.nancyimmo.bailleur.repositories.PropertyRepository;
import com.nancyimmo.bailleur.security.CurrentUser;

/**
 * Portail locataire : expose uniquement les données du bien loué par le
 * locataire connecté
 * (description du bien, situation de compte, etc.). Garantit l'isolation : un
 * locataire ne voit
 * jamais les données d'un autre locataire ni l'espace de gestion du bailleur.
 */
@Service
public class PortalService {

    private final LeaseRepository leaseRepository;
    private final PropertyRepository propertyRepository;
    private final PaymentRepository paymentRepository;
    private final PropertyService propertyService;
    private final LeaseService leaseService;
    private final CurrentUser currentUser;

    public PortalService(LeaseRepository leaseRepository,
            PropertyRepository propertyRepository,
            PaymentRepository paymentRepository,
            PropertyService propertyService,
            LeaseService leaseService,
            CurrentUser currentUser) {
        this.leaseRepository = leaseRepository;
        this.propertyRepository = propertyRepository;
        this.paymentRepository = paymentRepository;
        this.propertyService = propertyService;
        this.leaseService = leaseService;
        this.currentUser = currentUser;
    }

    /**
     * Le bien actuellement loué par le locataire connecté (avec bail, immeuble,
     * bailleur), ou null.
     */
    @Transactional(readOnly = true)
    public PropertyDetailsDto myProperty() {
        LeaseModel lease = currentLeaseWithProperty();
        if (lease == null) {
            return null;
        }
        return propertyRepository.findWithDetailsById(lease.getProperty().getId())
                .map(propertyService::toDetailsDto)
                .orElse(null);
    }

    /** Situation de compte (débits/crédits) du bail du locataire connecté. */
    @Transactional(readOnly = true)
    public List<StatementLineDto> myStatement() {
        return leaseService.buildStatement(currentLeaseWithProperty());
    }

    /**
     * Mois de loyer dus mais non réglés pour le bail du locataire connecté, du
     * début du bail
     * jusqu'au mois courant. Permet de régulariser les arriérés (status LATE) avant
     * de payer le
     * mois courant (status CURRENT). Triés du plus ancien au plus récent.
     */
    @Transactional(readOnly = true)
    public List<DueMonthDto> myDues() {
        LeaseModel lease = currentLeaseWithProperty();
        if (lease == null || lease.getStartDate() == null) {
            return List.of();
        }
        BigDecimal rent = lease.getRentAmount() != null ? lease.getRentAmount() : BigDecimal.ZERO;
        if (rent.signum() <= 0) {
            return List.of();
        }

        // Mois déjà réglés (paiements PAID).
        Set<YearMonth> paidMonths = paymentRepository.findByLeaseId(lease.getId()).stream()
                .filter(p -> "PAID".equalsIgnoreCase(p.getStatus()) && p.getPeriod() != null)
                .map(p -> YearMonth.from(p.getPeriod()))
                .collect(Collectors.toSet());

        YearMonth start = YearMonth.from(lease.getStartDate());
        YearMonth now = YearMonth.now();
        YearMonth end = lease.getEndDate() != null ? YearMonth.from(lease.getEndDate()) : now;
        if (end.isAfter(now)) {
            end = now;
        }

        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.FRENCH);
        List<DueMonthDto> dues = new ArrayList<>();
        for (YearMonth ym = start; !ym.isAfter(end); ym = ym.plusMonths(1)) {
            if (paidMonths.contains(ym)) {
                continue;
            }
            String status = ym.isBefore(now) ? "LATE" : "CURRENT";
            dues.add(new DueMonthDto(ym.atDay(1), capitalize(ym.format(monthFmt)), rent, status));
        }
        return dues;
    }

    private String capitalize(String s) {
        return (s == null || s.isEmpty()) ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    /** Bail du locataire connecté portant sur un bien (le premier trouvé). */
    private LeaseModel currentLeaseWithProperty() {
        String email = currentUser.requireTenant().getEmail();
        return leaseRepository.findByTenant_Email(email).stream()
                .filter(l -> l.getProperty() != null)
                .findFirst()
                .orElse(null);
    }

    /**
     * Calcule les mois dus entre le début du bail et le mois courant, hors mois
     * déjà réglés.
     */
    public List<DueMonthDto> computeDues(LocalDate startDate, LocalDate endDate,
            BigDecimal rent, Set<YearMonth> paidMonths, YearMonth now) {
        if (startDate == null || rent == null || rent.signum() <= 0) {
            return List.of();
        }
        YearMonth start = YearMonth.from(startDate);
        YearMonth end = endDate != null ? YearMonth.from(endDate) : now;
        if (end.isAfter(now)) {
            end = now;
        }
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.FRENCH);
        List<DueMonthDto> dues = new ArrayList<>();
        for (YearMonth ym = start; !ym.isAfter(end); ym = ym.plusMonths(1)) {
            if (paidMonths.contains(ym)) {
                continue;
            }
            String status = ym.isBefore(now) ? "LATE" : "CURRENT";
            dues.add(new DueMonthDto(ym.atDay(1), capitalize(ym.format(monthFmt)), rent, status));
        }
        return dues;
    }
}
