package com.rememory.security;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import java.security.Key;
import java.util.Date;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
class JwtProviderTest {

    @Autowired
    JwtProvider jwtProvider;

    @Value("${jwt.secret}")
    private String secret;

    // ===== createToken =====

    @Test
    @DisplayName("토큰 생성 성공")
    void createToken_성공() {
        String token = jwtProvider.createToken(1L);

        assertThat(token).isNotNull();
        assertThat(token.split("\\.")).hasSize(3); // header.payload.signature
    }

    @Test
    @DisplayName("다른 memberId는 다른 토큰 생성")
    void createToken_다른memberId_다른토큰() {
        String token1 = jwtProvider.createToken(1L);
        String token2 = jwtProvider.createToken(2L);

        assertThat(token1).isNotEqualTo(token2);
    }

    // ===== parseToken =====

    @Test
    @DisplayName("토큰 파싱 성공 - memberId 추출")
    void parseToken_성공() {
        String token = jwtProvider.createToken(1L);

        Claims claims = jwtProvider.parseToken(token);

        assertThat(claims.getSubject()).isEqualTo("1");
    }

    @Test
    @DisplayName("토큰 파싱 성공 - 만료시간 포함")
    void parseToken_만료시간_포함() {
        String token = jwtProvider.createToken(1L);

        Claims claims = jwtProvider.parseToken(token);

        assertThat(claims.getExpiration()).isNotNull();
        assertThat(claims.getIssuedAt()).isNotNull();
    }

    @Test
    @DisplayName("잘못된 형식의 토큰 - TOKEN_MALFORMED 예외")
    void parseToken_잘못된형식_예외() {
        assertThatThrownBy(() -> jwtProvider.parseToken("invalid.token.value"))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.TOKEN_MALFORMED.getMessage());
    }

    @Test
    @DisplayName("빈 토큰 - TOKEN_EMPTY 예외")
    void parseToken_빈토큰_예외() {
        assertThatThrownBy(() -> jwtProvider.parseToken(""))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.TOKEN_EMPTY.getMessage());
    }

    @Test
    @DisplayName("null 토큰 - TOKEN_EMPTY 예외")
    void parseToken_null토큰_예외() {
        assertThatThrownBy(() -> jwtProvider.parseToken(null))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.TOKEN_EMPTY.getMessage());
    }

    @Test
    @DisplayName("다른 키로 서명된 토큰 - TOKEN_INVALID 예외")
    void parseToken_다른키_예외() {
        JwtProvider fakeProvider = new JwtProvider(
                "fake-secret-key-that-is-at-least-32-bytes!!", 86400000L);
        String fakeToken = fakeProvider.createToken(1L);

        assertThatThrownBy(() -> jwtProvider.parseToken(fakeToken))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.TOKEN_INVALID.getMessage());
    }

    @Test
    @DisplayName("subject가 숫자가 아닌 토큰 - TOKEN_INVALID 예외")
    void parseToken_subject_숫자아님_예외() {
        // 같은 키로 subject를 문자열로 만든 토큰
        Key key = Keys.hmacShaKeyFor(secret.getBytes());
        String fakeToken = Jwts.builder()
                .setSubject("notANumber")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000L))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        assertThatThrownBy(() -> jwtProvider.parseToken(fakeToken))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.TOKEN_INVALID.getMessage());
    }

    // ===== getRemainingExpiration =====

    @Test
    @DisplayName("남은 만료 시간 조회 성공")
    void getRemainingExpiration_성공() {
        String token = jwtProvider.createToken(1L);

        long remaining = jwtProvider.getRemainingExpiration(token);

        assertThat(remaining).isGreaterThan(0);
        assertThat(remaining).isLessThanOrEqualTo(86400000L);
    }
}
