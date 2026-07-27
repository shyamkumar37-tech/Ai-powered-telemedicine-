package com.telecareplus.service;

import java.io.InputStream;

public interface StorageService {
    String uploadFile(String objectName, InputStream stream, String contentType);
    String getFileUrl(String objectName);
    void deleteFile(String objectName);
}
