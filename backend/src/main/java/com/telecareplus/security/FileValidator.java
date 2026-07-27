package com.telecareplus.security;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import com.telecareplus.exception.BadRequestException;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

@Component
public class FileValidator {

    private static final byte[] MAGIC_PDF = {0x25, 0x50, 0x44, 0x46}; // %PDF
    private static final byte[] MAGIC_JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] MAGIC_PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    private static final byte[] MAGIC_RIFF = {0x52, 0x49, 0x46, 0x46}; // RIFF (WAV)
    private static final byte[] MAGIC_ID3 = {0x49, 0x44, 0x33}; // ID3 (MP3)
    private static final byte[] MAGIC_DICOM = {0x44, 0x49, 0x43, 0x4D}; // DICM at offset 128

    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty or missing");
        }

        String filename = file.getOriginalFilename();
        if (filename != null && (filename.contains("..") || filename.contains("/"))) {
            throw new BadRequestException("Path traversal attempt detected in filename");
        }

        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[132];
            int bytesRead = is.read(header, 0, 132);
            if (bytesRead < 4) {
                throw new BadRequestException("File is too small to determine type");
            }

            if (isPdf(header) || isJpeg(header) || isPng(header) || isWav(header) || isMp3(header) || isDicom(header, bytesRead)) {
                return; // Valid file
            }
            throw new BadRequestException("Invalid file format. Only PDF, JPEG, PNG, DICOM, WAV, and MP3 are allowed.");
        } catch (IOException e) {
            throw new BadRequestException("Failed to read file content for validation");
        }
    }

    private boolean isPdf(byte[] header) {
        return matchesMagic(header, MAGIC_PDF, 0);
    }

    private boolean isJpeg(byte[] header) {
        return matchesMagic(header, MAGIC_JPEG, 0);
    }

    private boolean isPng(byte[] header) {
        return matchesMagic(header, MAGIC_PNG, 0);
    }

    private boolean isWav(byte[] header) {
        return matchesMagic(header, MAGIC_RIFF, 0);
    }

    private boolean isMp3(byte[] header) {
        return matchesMagic(header, MAGIC_ID3, 0) || (header[0] == (byte) 0xFF && (header[1] == (byte) 0xFB || header[1] == (byte) 0xF3 || header[1] == (byte) 0xF2));
    }

    private boolean isDicom(byte[] header, int bytesRead) {
        if (bytesRead < 132) return false;
        return matchesMagic(header, MAGIC_DICOM, 128);
    }

    private boolean matchesMagic(byte[] header, byte[] magic, int offset) {
        if (header.length < offset + magic.length) return false;
        for (int i = 0; i < magic.length; i++) {
            if (header[offset + i] != magic[i]) {
                return false;
            }
        }
        return true;
    }
}
