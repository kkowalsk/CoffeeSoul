package com.coffeesoul.api.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Prefixes every @RestController mapping with <api.base-path>/<api.version>
// (e.g. /api/v1) so version/base live in application.properties rather than
// being hardcoded on each controller. Actuator endpoints use a separate
// handler mapping and are intentionally left unprefixed.
@Configuration
public class ApiPathConfig implements WebMvcConfigurer {

    private final String basePath;
    private final String version;

    public ApiPathConfig(
            @Value("${api.base-path}") String basePath,
            @Value("${api.version}") String version) {
        this.basePath = basePath;
        this.version = version;
    }

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        String prefix = basePath + "/" + version;
        configurer.addPathPrefix(prefix, clazz -> clazz.isAnnotationPresent(RestController.class));
    }
}
