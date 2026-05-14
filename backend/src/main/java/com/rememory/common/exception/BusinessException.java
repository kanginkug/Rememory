package com.rememory.common.exception;

import lombok.Getter;

/**
 * 비즈니스 로직 예외
 * 서비스 규칙을 어겼을 때 의도적으로 던지는 예외
 * ex) 존재하지 않는 회원, 만료된 초대 링크, 이미 작성한 후기
 */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
