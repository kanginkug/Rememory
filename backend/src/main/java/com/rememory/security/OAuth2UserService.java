package com.rememory.security;

import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class OAuth2UserService extends DefaultOAuth2UserService {
    private final MemberRepository memberRepository;

    /** 카카오/구글 OAuth2 로그인 처리: 최초 로그인 시 자동 회원가입, 탈퇴 회원 복구 */
    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

        OAuth2User oAuth2User = super.loadUser(userRequest);

        // provider 추출 (kakao or google)
        String provider = userRequest.getClientRegistration().getRegistrationId();

        // provider별로 oauthId, name, email 추출
        String oauthId;
        String name;
        String email;
        String profileImageUrl;

        if (provider.equals("kakao")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> kakaoAccount = (Map<String, Object>) oAuth2User.getAttributes().get("kakao_account");
            if (kakaoAccount == null) {
                throw new OAuth2AuthenticationException("kakao_account_missing");
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            if (profile == null) {
                throw new OAuth2AuthenticationException("kakao_profile_missing");
            }
            oauthId = String.valueOf(oAuth2User.getAttributes().get("id"));
            name = (String) profile.get("nickname");
            email = (String) kakaoAccount.get("email");
            profileImageUrl = (String) profile.get("profile_image_url");
        } else { // google
            oauthId = (String) oAuth2User.getAttributes().get("sub");
            name = (String) oAuth2User.getAttributes().get("name");
            email = (String) oAuth2User.getAttributes().get("email");
            profileImageUrl = (String) oAuth2User.getAttributes().get("picture");
        }

        // DB 조회 → 없으면 회원가입
        memberRepository.findByOauthProviderAndOauthId(provider, oauthId)
                .map(existing -> {
                    if(existing.getDeletedAt() != null) {
                        existing.restore(); // 탈퇴회원 - > 계정 복구
                    }
                    return existing; // 활성 회원 -> 그대로 반환
                })
                .orElseGet(() -> {
                    Member newMember = Member.create(name, email, profileImageUrl, provider, oauthId);
                    memberRepository.save(newMember);
                    return newMember;
                });

        return oAuth2User;
    }
}
