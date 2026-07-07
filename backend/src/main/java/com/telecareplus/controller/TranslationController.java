package com.telecareplus.controller;

import com.telecareplus.dto.TranslationDtos;
import com.telecareplus.service.TranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/translations")
@RequiredArgsConstructor
public class TranslationController {

    private final TranslationService translationService;

    @PostMapping
    public TranslationDtos.TranslateResponse translate(@RequestBody TranslationDtos.TranslateRequest request) {
        return translationService.translate(request);
    }
}
