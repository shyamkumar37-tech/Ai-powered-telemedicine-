package com.telecareplus;

import com.telecareplus.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class TelecareplusApplication {

    public static void main(String[] args) {
        SpringApplication.run(TelecareplusApplication.class, args);
    }
}
