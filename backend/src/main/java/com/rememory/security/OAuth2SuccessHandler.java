package com.rememory.security;

import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /** OAuth2 인증 성공 후 JWT 발급 및 프론트 콜백 URL로 리다이렉트 */
    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request,
                                        @NonNull HttpServletResponse response,
                                        @NonNull Authentication authentication) throws IOException {

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
        String refreshToken = member.getRefreshToken();

        getRedirectStrategy().sendRedirect(request, response,
                frontendUrl + "/auth/callback?token=" + token + "&refreshToken=" + refreshToken);
    }
}
