package com.rememory.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 에러 응답 DTO
 * GlobalExceptionHandler에서 클라이언트에 반환
 */
@Getter
@RequiredArgsConstructor
public class ErrorResponse {

    /** 에러 코드 ex) M001, R002 */
    private final String code;

    /** 에러 메시지 ex) 존재하지 않는 회원입니다. */
    private final String message;
}
