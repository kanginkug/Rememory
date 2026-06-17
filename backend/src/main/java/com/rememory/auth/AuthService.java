package com.rememory.auth;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AuthService {
    private final MemberRepository memberRepository;
    private final JwtProvider jwtProvider;

    public Map<String, String> reissueToken(Map<String, String> map) {
        String refreshToken = map.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        Member member = memberRepository.findByRefreshToken(refreshToken).orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID));

        if(member.getRefreshTokenExpiresAt().isBefore(LocalDateTime.now())){
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        String newAccessToken = jwtProvider.createToken(member.getId());
        return Map.of("accessToken", newAccessToken);
    }
}
