package com.telecareplus.service;

import com.telecareplus.dto.TranslationDtos;

public interface TranslationService {

    TranslationDtos.TranslateResponse translate(TranslationDtos.TranslateRequest request);
}
