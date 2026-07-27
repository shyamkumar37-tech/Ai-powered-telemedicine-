package com.telecareplus;

import com.telecareplus.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;
@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
// @EnableCaching
@EnableScheduling
@EnableAsync
public class TelecareplusApplication {

    public static void main(String[] args) {
        SpringApplication.run(TelecareplusApplication.class, args);
    }
}
