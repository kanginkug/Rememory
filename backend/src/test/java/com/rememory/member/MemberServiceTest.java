package com.rememory.member;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Transactional
class MemberServiceTest {

    @Autowired
    MemberService memberService;

    @Autowired
    MemberRepository memberRepository;

    // ===== 테스트 데이터 =====
    private static final String NAME = "홍길동";
    private static final String EMAIL = "hong@gmail.com";
    private static final String PROFILE_IMAGE = "http://profile.img/1";
    private static final String PROVIDER = "KAKAO";
    private static final String OAUTH_ID = "kakao_12345";

    // ===== join =====

    @Test
    @DisplayName("회원가입 성공")
    void join_성공() {
        // when
        memberService.join(NAME, EMAIL, PROFILE_IMAGE, PROVIDER, OAUTH_ID);

        // then
        Optional<Member> found = memberService.findByOauthProviderAndOauthId(PROVIDER, OAUTH_ID);
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo(NAME);
        assertThat(found.get().getEmail()).isEqualTo(EMAIL);
        assertThat(found.get().getOauthProvider()).isEqualTo(PROVIDER);
        assertThat(found.get().getOauthId()).isEqualTo(OAUTH_ID);
    }

    @Test
    @DisplayName("회원가입 시 createdAt 자동 세팅")
    void join_createdAt_자동세팅() {
        // when
        memberService.join(NAME, EMAIL, PROFILE_IMAGE, PROVIDER, OAUTH_ID);

        // then
        Member member = memberService.findByOauthProviderAndOauthId(PROVIDER, OAUTH_ID).get();
        assertThat(member.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("카카오, 구글 동일 oauthId라도 provider 다르면 별개 회원")
    void join_다른_provider는_다른_회원() {
        // given
        memberService.join(NAME, EMAIL, PROFILE_IMAGE, "KAKAO", OAUTH_ID);
        memberService.join("다른이름", "other@gmail.com", PROFILE_IMAGE, "GOOGLE", OAUTH_ID);

        // then
        Optional<Member> kakaoMember = memberService.findByOauthProviderAndOauthId("KAKAO", OAUTH_ID);
        Optional<Member> googleMember = memberService.findByOauthProviderAndOauthId("GOOGLE", OAUTH_ID);

        assertThat(kakaoMember).isPresent();
        assertThat(googleMember).isPresent();
        assertThat(kakaoMember.get().getId()).isNotEqualTo(googleMember.get().getId());
    }

    // ===== findByOauthProviderAndOauthId =====

    @Test
    @DisplayName("로그인 조회 성공 - 기존 회원")
    void findByOauth_기존회원_조회성공() {
        // given
        memberService.join(NAME, EMAIL, PROFILE_IMAGE, PROVIDER, OAUTH_ID);

        // when
        Optional<Member> found = memberService.findByOauthProviderAndOauthId(PROVIDER, OAUTH_ID);

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo(NAME);
    }

    @Test
    @DisplayName("로그인 조회 - 없는 회원이면 Optional.empty()")
    void findByOauth_없는회원_빈Optional() {
        // when
        Optional<Member> found = memberService.findByOauthProviderAndOauthId("KAKAO", "없는아이디");

        // then
        assertThat(found).isEmpty();
    }

    // ===== findOne =====

    @Test
    @DisplayName("id로 회원 조회 성공")
    void findOne_성공() {
        // given
        memberService.join(NAME, EMAIL, PROFILE_IMAGE, PROVIDER, OAUTH_ID);
        Long id = memberService.findByOauthProviderAndOauthId(PROVIDER, OAUTH_ID).get().getId();

        // when
        Optional<Member> found = memberService.findOne(id);

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(id);
    }

    @Test
    @DisplayName("없는 id로 조회하면 Optional.empty()")
    void findOne_없는id_빈Optional() {
        // when
        Optional<Member> found = memberService.findOne(999999L);

        // then
        assertThat(found).isEmpty();
    }

    // ===== delete =====

    @Test
    @DisplayName("회원 탈퇴 성공 - deletedAt 세팅")
    void delete_성공() {
        // given
        memberService.join(NAME, EMAIL, PROFILE_IMAGE, PROVIDER, OAUTH_ID);
        Long id = memberService.findByOauthProviderAndOauthId(PROVIDER, OAUTH_ID).get().getId();

        // when
        memberService.delete(id);

        // then
        Member deleted = memberService.findOne(id).get();
        assertThat(deleted.getDeletedAt()).isNotNull();
    }

    @Test
    @DisplayName("없는 회원 탈퇴 시 BusinessException 발생")
    void delete_없는회원_예외발생() {
        // when & then
        assertThatThrownBy(() -> memberService.delete(999999L))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_NOT_FOUND.getMessage());
    }
}
