package com.nancyimmo.bailleur.services;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Set;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;

/** Normalisation des images uploadées (photos de biens). */
@Service
public class ImageService {

    /** Types acceptés. Liste explicite : le SVG est exclu (script embarqué = XSS). */
    public static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");

    /** Taille maximale acceptée en entrée (5 Mo). */
    public static final long MAX_UPLOAD_BYTES = 5L * 1024 * 1024;

    /** Côté le plus long au-delà duquel l'image est redimensionnée. */
    private static final int MAX_DIMENSION = 1600;

    /** Résultat de la normalisation : octets à stocker + type MIME correspondant. */
    public record Normalized(byte[] content, String contentType) { }

    /**
     * Redimensionne l'image si son côté le plus long dépasse {@value #MAX_DIMENSION} px,
     * afin de limiter le volume stocké en base. Les formats que la JVM ne sait pas
     * décoder (WebP par exemple) sont conservés tels quels.
     */
    public Normalized normalize(byte[] original, String contentType) {
        BufferedImage source;
        try {
            source = ImageIO.read(new ByteArrayInputStream(original));
        } catch (IOException e) {
            source = null;
        }
        if (source == null) {
            return new Normalized(original, contentType);
        }

        int width = source.getWidth();
        int height = source.getHeight();
        int longest = Math.max(width, height);
        if (longest <= MAX_DIMENSION) {
            return new Normalized(original, contentType);
        }

        double ratio = (double) MAX_DIMENSION / longest;
        int targetWidth = Math.max(1, (int) Math.round(width * ratio));
        int targetHeight = Math.max(1, (int) Math.round(height * ratio));

        // Le JPEG ne gère pas la transparence : on aplatit sur un fond blanc.
        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resized.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, targetWidth, targetHeight);
            g.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        } finally {
            g.dispose();
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            if (!ImageIO.write(resized, "jpg", out)) {
                return new Normalized(original, contentType);
            }
        } catch (IOException e) {
            return new Normalized(original, contentType);
        }
        return new Normalized(out.toByteArray(), "image/jpeg");
    }
}
