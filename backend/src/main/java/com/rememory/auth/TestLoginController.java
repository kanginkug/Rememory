package com.rememory.auth;

import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Profile("!prod")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class TestLoginController {

    private static final String TEST_PROVIDER = "TEST";

    private final MemberRepository memberRepository;
    private final JwtProvider jwtProvider;

    /**
     * k6 부하테스트 전용 로그인 API.
     * prod 프로필에서는 빈 자체가 등록되지 않아 404 반환.
     *
     * body: { "testUserId": "k6-user-1" }  (생략 시 "k6-default")
     */
    @PostMapping("/test-login")
    @Transactional
    public ResponseEntity<Map<String, String>> testLogin(@RequestBody(required = false) Map<String, String> body) {
        String testUserId = (body != null && body.containsKey("testUserId"))
                ? body.get("testUserId")
                : "k6-default";

        Member member = memberRepository.findByOauthProviderAndOauthId(TEST_PROVIDER, testUserId)
                .orElseGet(() -> {
                    Member newMember = Member.create(
                            testUserId,
                            null,
                            null,
                            TEST_PROVIDER,
                            testUserId,
                            null,
                            null
                    );
                    memberRepository.save(newMember);
                    return newMember;
                });

        String accessToken = jwtProvider.createToken(member.getId());
        return ResponseEntity.ok(Map.of("accessToken", accessToken));
    }
}
