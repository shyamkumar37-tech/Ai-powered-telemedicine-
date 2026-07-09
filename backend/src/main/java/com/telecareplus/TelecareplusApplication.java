package com.telecareplus;

import com.telecareplus.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
@EnableCaching
@EnableScheduling
public class TelecareplusApplication {

    public static void main(String[] args) {
        SpringApplication.run(TelecareplusApplication.class, args);
    }
}
