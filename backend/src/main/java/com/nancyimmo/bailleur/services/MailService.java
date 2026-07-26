package com.nancyimmo.bailleur.services;

import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

/**
 * Envoi des emails transactionnels (réinitialisation de mot de passe).
 *
 * <p>Si aucun expéditeur n'est configuré ({@code app.mail.from} / {@code MAIL_USERNAME} vides),
 * le service bascule en « mode dev » : le lien de réinitialisation est écrit dans les logs
 * au lieu d'être envoyé. L'application reste ainsi fonctionnelle sans configuration SMTP.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String from;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /** @return true si un expéditeur SMTP est configuré (envoi réel actif). */
    public boolean isConfigured() {
        return from != null && !from.isBlank();
    }

    /**
     * Envoie l'email de réinitialisation. En cas d'échec SMTP (ou de configuration absente),
     * le lien est journalisé pour ne jamais bloquer le parcours utilisateur.
     */
    public void sendPasswordReset(String toEmail, String firstName, String resetLink) {
        if (!isConfigured()) {
            log.warn("[MAIL désactivé] Lien de réinitialisation pour {} : {}", toEmail, resetLink);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Réinitialisation de votre mot de passe — Nancy Immo");
            helper.setText(buildHtml(firstName, resetLink), true);
            mailSender.send(message);
            log.info("Email de réinitialisation envoyé à {}", toEmail);
        } catch (Exception e) {
            // On ne propage pas l'erreur : le contrôleur renvoie un message générique.
            log.error("Échec de l'envoi de l'email de réinitialisation à {}. Lien de secours : {}",
                    toEmail, resetLink, e);
        }
    }

    private String buildHtml(String firstName, String resetLink) {
        String hello = (firstName == null || firstName.isBlank()) ? "Bonjour," : "Bonjour " + firstName + ",";
        return """
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#F4F6F3;padding:32px;">
                  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E4E7E2;">
                    <div style="background:#0E4F4A;padding:22px 28px;color:#fff;font-weight:800;font-size:18px;">
                      Nancy<span style="color:#7FC9BD;">Immo</span>
                    </div>
                    <div style="padding:28px;color:#16201D;">
                      <p style="margin:0 0 12px;font-size:15px;">%s</p>
                      <p style="margin:0 0 18px;font-size:14.5px;color:#5A655F;line-height:1.6;">
                        Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton
                        ci-dessous pour en choisir un nouveau. Ce lien est valable <strong>30 minutes</strong>.
                      </p>
                      <p style="text-align:center;margin:26px 0;">
                        <a href="%s" style="display:inline-block;background:#0E4F4A;color:#fff;text-decoration:none;
                           font-weight:700;font-size:15px;padding:13px 28px;border-radius:12px;">
                          Réinitialiser mon mot de passe
                        </a>
                      </p>
                      <p style="margin:0 0 6px;font-size:12.5px;color:#9AA49E;">
                        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
                      </p>
                      <p style="margin:0 0 18px;font-size:12.5px;word-break:break-all;color:#2A9D8F;">%s</p>
                      <p style="margin:0;font-size:12.5px;color:#9AA49E;line-height:1.5;">
                        Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email, votre mot de passe reste inchangé.
                      </p>
                    </div>
                    <div style="padding:16px 28px;background:#F4F6F3;font-size:11.5px;color:#9AA49E;">
                      © 2026 Nancy Immo — Gestion locative
                    </div>
                  </div>
                </div>
                """.formatted(hello, resetLink, resetLink);
    }
}
