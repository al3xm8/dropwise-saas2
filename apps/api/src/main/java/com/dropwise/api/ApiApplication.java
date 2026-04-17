package com.dropwise.api;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class ApiApplication {

	@Bean
	public WebMvcConfigurer webMvcConfigurer(
		@Value("${app.web.allowed-origins:http://localhost:3000}") String allowedOrigins
	) {
		String[] origins = Arrays.stream(allowedOrigins.split(","))
			.map(String::trim)
			.filter(value -> !value.isEmpty())
			.toArray(String[]::new);

		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/api/**")
					.allowedOrigins(origins)
					.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
					.allowedHeaders("*");
			}
		};
	}

	public static void main(String[] args) {
		SpringApplication.run(ApiApplication.class, args);
	}

}
