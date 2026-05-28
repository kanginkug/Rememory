package com.rememory.security;

import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.io.IOException;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;
    private final MemberRepository memberRepository;

    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request,
                                        @NonNull HttpServletResponse response,
                                        @NonNull Authentication authentication) throws IOException {

        // 카카오/구글 유저 정보 추출
        OAuth2User oAuth2User = (OAuth2User) Objects.requireNonNull(authentication.getPrincipal());

        String provider = ((OAuth2AuthenticationToken) authentication).getAuthorizedClientRegistrationId();

        String oauthId;
        if (provider.equals("kakao")) {
            oauthId = String.valueOf(oAuth2User.getAttributes().get("id"));
        } else {
            oauthId = (String) oAuth2User.getAttributes().get("sub");
        }

        Member member = memberRepository.findByOauthProviderAndOauthId(provider, oauthId)
                .orElseThrow(() -> new AuthenticationServiceException("회원 정보를 찾을 수 없습니다."));

        String token = jwtProvider.createToken(member.getId());

        // 프론트로 토큰과 함께 리다이렉트 (배포 전 HttpOnly 쿠키 방식으로 변경 예정)
        getRedirectStrategy().sendRedirect(request, response,
                "http://localhost:3000/auth/callback?token=" + token);
    }
}
