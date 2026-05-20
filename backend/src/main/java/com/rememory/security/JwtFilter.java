package com.rememory.security;

import com.rememory.common.exception.BusinessException;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// JWT 인증 필터: 매 요청마다 한 번씩 실행(OncePerRequestFilter)되어 토큰을 검증한다
// Authorization 헤더(Bearer) 에서 토큰을 추출한다
@Component
@RequiredArgsConstructor
public class JwtFilter  extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    // 요청에서 JWT를 추출해 검증하고, 유효한 경우 SecurityContext에 인증 정보를 설정한다
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if(token != null){
            try {
                Claims claims = jwtProvider.parseToken(token);
                setAuthentication(request, claims);
            } catch (BusinessException e) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":\"" + e.getErrorCode().name() + "\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    // Authorization 헤더 내 토큰 추출
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if(header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        } else {
            return null;
        }
    }

    // SecurityContext에 인증 정보 등록
    private void setAuthentication(HttpServletRequest request, Claims claims) {
        Long memberId = Long.parseLong(claims.getSubject());

        request.setAttribute("memberId", memberId);

        // 이 요청에 한해서 "인증된 사용자"로 등록
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        memberId, // principal: 인증된 사용자 (memberId)
                        null,     // credentials: 비밀번호 (JWT 방식이라 불필요)
                        List.of() // authorities: 권한 목록 (role 없으니까 빈 리스트)
                );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
