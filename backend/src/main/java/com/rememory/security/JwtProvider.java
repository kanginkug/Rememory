package com.rememory.security;

import com.rememory.common.exception.BusinessException;
import io.jsonwebtoken.security.SignatureException;
import com.rememory.common.exception.ErrorCode;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

// JWT Access Token 생성·파싱·검증을 담당하는 컴포넌트
// HS256 알고리즘을 사용하며, 토큰 페이로드에 memberId를 포함한다
@Component
public class JwtProvider {
    private final Key key;
    private final long expirationMs; // Access Token 유효기간 (밀리초)

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms:86400000}") long expirationsMs)
    {
        // HS256 최소 키 길이(32바이트) 검증: 미달 시 앱 기동 실패로 잘못된 설정을 즉시 인지
        if (secret.getBytes().length < 32) {
            throw new IllegalArgumentException("JWT_SECRET은 32바이트 이상이어야 합니다. 현재: " + secret.getBytes().length + "바이트");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationsMs;
    }

    // Access Token 생성: subject=memberId, 만료시간 설정 후 HS256으로 서명한다
    public String createToken(Long memberId) {
        return Jwts.builder()
                .setSubject(String.valueOf(memberId))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // 토큰 파싱: 서명을 검증하고 Claims(페이로드)를 반환한다
    // 토큰 유효성 검사: 파싱 성공 여부로 유효성을 판단하며 예외는 false로 변환한다
    // 서명 불일치·만료 등 이상이 있으면 JwtException을 던진다
    public Claims parseToken(String token){
        try {
            Claims claims =  Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    // 받은 토큰을 분해하고 서명키로 재서명 후 비교
                    // + 만료시각도 체크 (만료되면 ExpiredJwtException 던짐)
                    // + 형식이 잘못되면 MalformedJwtException 던짐
                    .parseClaimsJws(token)
                    .getBody();
            // subject가 숫자가 아니면 우리가 발급한 토큰이 아니기 때문에 숫자타입 확인
            Long.parseLong(claims.getSubject());
            return claims;
        } catch (ExpiredJwtException e) {
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        } catch (SignatureException | SecurityException | NumberFormatException e) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        } catch (MalformedJwtException e) {
            throw new BusinessException(ErrorCode.TOKEN_MALFORMED);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.TOKEN_EMPTY);
        }
    }

    // 토큰의 남은 만료 시간 반환 (밀리초)
    public long getRemainingExpiration(String token) {
        Date expiration = parseToken(token).getExpiration();
        return expiration.getTime() - System.currentTimeMillis();
    }
}
