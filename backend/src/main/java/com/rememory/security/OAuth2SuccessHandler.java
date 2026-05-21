package com.rememory.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.io.IOException;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;

    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request,
                                        @NonNull HttpServletResponse response,
                                        @NonNull Authentication authentication) throws IOException {

        // 카카오/구글 유저 정보 추출
        OAuth2User oAuth2User = (OAuth2User) Objects.requireNonNull(authentication.getPrincipal());
        Long memberId = (Long) oAuth2User.getAttributes().get("memberId");

        String token = jwtProvider.createToken(memberId);

        // 프론트로 토큰과 함께 리다이렉트
        getRedirectStrategy().sendRedirect(request, response,
                "http://localhost:3000/auth/callback?token=" + token);
    }
}
