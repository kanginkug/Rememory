package com.rememory.common.config;

import com.rememory.security.JwtFilter;
import com.rememory.security.OAuth2SuccessHandler;
import com.rememory.security.OAuth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtFilter jwtFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2UserService oAuth2UserService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // corsConfigurationSource()에서 설정한 내용 적용
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // CSRF 보호 비활성화
                // REST API + JWT 방식은 CSRF 공격에 취약하지 않아서 불필요
                .csrf(csrf -> csrf.disable())
                // 세션 사용 안 함
                // JWT 방식이라 서버에 세션 저장 불필요
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 카카오/구글 OAuth 로그인 설정
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(oAuth2UserService) // 카카오/구글에서 유저 정보 받아옴 & 정보 없으면 회원가입
                        )
                        .successHandler(oAuth2SuccessHandler)   // 로그인 성공 시 JWT 발급
                        .failureHandler((req, res, ex) ->
                                res.sendRedirect("http://localhost:3000/login?error=oauth_failed"))
                )
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().authenticated()
                )
                // JwtFilter를 UsernamePasswordAuthenticationFilter 앞에 등록
                // 모든 요청에서 JWT 검증을 먼저 수행
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    // CORS : 다른 출처에서 오는 요청을 허용할지 설정
    public CorsConfigurationSource corsConfigurationSource() {
        // CORS 설정 객체 생성
        CorsConfiguration config = new CorsConfiguration();
        // 이 주소에서 오는 요청만 허용
        config.setAllowedOrigins(List.of("http://localhost:3000")); // 프론트 주소
        // 허용할 HTTP 메서드
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // 허용할 헤더
        // * = 모든 헤더 허용 (Authorization 헤더도 포함)
        config.setAllowedHeaders(List.of("*"));
        // 쿠키, Authorization 헤더 등 인증 정보 포함 요청 허용
        // JWT를 Authorization 헤더로 보내니까 true 필요
        config.setAllowCredentials(true);

        // /** = 모든 URL에 위 설정 적용
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
