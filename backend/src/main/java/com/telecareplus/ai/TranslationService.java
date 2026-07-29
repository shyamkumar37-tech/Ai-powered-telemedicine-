package com.telecareplus.ai;

import com.telecareplus.ai.TranslationDtos;

public interface TranslationService {

    TranslationDtos.TranslateResponse translate(TranslationDtos.TranslateRequest request);
}
