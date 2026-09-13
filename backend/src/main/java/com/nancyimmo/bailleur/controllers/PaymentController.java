package com.nancyimmo.bailleur.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import org.springframework.http.*;

import java.time.Year;
import java.util.Map;

import com.nancyimmo.bailleur.dto.PaymentDto;
import com.nancyimmo.bailleur.dto.PaymentStatsDto;
import com.nancyimmo.bailleur.dto.TenantPaymentHistoryDto;
import com.nancyimmo.bailleur.services.PaymentService;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public PaymentDto create(@RequestBody PaymentDto dto) {
        return paymentService.create(dto);
    }

    @GetMapping
    public List<PaymentDto> getAll(
            @RequestParam(required = false) Long leaseId,
            @RequestParam(required = false) String status) {
        if (leaseId != null)
            return paymentService.findByLeaseId(leaseId);
        if (status != null)
            return paymentService.findByStatus(status);
        return paymentService.findAll();
    }

    @GetMapping("/stats")
    public PaymentStatsDto getStats() {
        return paymentService.getStats();
    }

    /**
     * Crée une session Stripe Checkout pour payer un loyer en ligne ; renvoie
     * l'URL.
     */
    @PostMapping("/checkout")
    public Map<String, String> checkout(@RequestBody Map<String, Object> body) {
        Long leaseId = Long.valueOf(String.valueOf(body.get("leaseId")));
        String period = body.get("period") != null ? String.valueOf(body.get("period")) : null;
        return Map.of("url", paymentService.createCheckout(leaseId, period));
    }

    /** Confirme le retour de Stripe et enregistre le paiement s'il est réglé. */
    @PostMapping("/confirm")
    public PaymentDto confirm(@RequestBody Map<String, String> body) {
        return paymentService.confirmCheckout(body.get("sessionId"));
    }

    /**
     * Historique annuel des paiements d'un locataire (encaissé / en attente /
     * retard par mois).
     */
    @GetMapping("/tenant/{tenantId}/history")
    public TenantPaymentHistoryDto getTenantHistory(
            @PathVariable Long tenantId,
            @RequestParam(required = false) Integer year) {
        int y = year != null ? year : Year.now().getValue();
        return paymentService.getTenantYearHistory(tenantId, y);
    }

    @GetMapping("/{id}")
    public PaymentDto getOne(@PathVariable Long id) {
        return paymentService.findById(id);
    }

    @PutMapping("/{id}")
    public PaymentDto update(@PathVariable Long id, @RequestBody PaymentDto dto) {
        return paymentService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        paymentService.delete(id);
    }

    @GetMapping("/export.csv")
    public ResponseEntity<byte[]> exportCsv() {
        StringBuilder sb = new StringBuilder("periode;montant;statut;date_paiement\n");
        for (PaymentDto p : paymentService.findAll()) {
            sb.append(p.getPeriod()).append(';')
                    .append(p.getAmount()).append(';')
                    .append(p.getStatus()).append(';')
                    .append(p.getPaidDate() == null ? "" : p.getPaidDate())
                    .append('\n');
        }
        byte[] csv = sb.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"paiements.csv\"")
                .body(csv);
    }

}
