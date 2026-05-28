package com.rememory.common.exception;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * 전역 예외 처리
 * - BusinessException                  : 비즈니스 로직 예외 (400)
 * - MethodArgumentNotValidException     : DTO 검증 실패 (400)
 * - NoResourceFoundException            : 존재하지 않는 경로 (404)
 * - HttpMessageNotReadableException     : 잘못된 JSON / ENUM body 값 (400)
 * - MethodArgumentTypeMismatchException : 잘못된 쿼리 파라미터 ENUM (400)
 * - ConstraintViolationException        : @Validated @RequestParam 검증 실패 (400)
 * - Exception                           : 예상 못한 서버 에러 (500)
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 비즈니스 예외 처리
     * ex) 존재하지 않는 회원, 만료된 초대 링크, 이미 작성한 후기
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();
        log.warn("[BusinessException] code={}, status={}, message={}", errorCode.getCode(), errorCode.getStatus(), errorCode.getMessage());
        return ResponseEntity
                .status(errorCode.getStatus())
                .body(new ErrorResponse(errorCode.getCode(), errorCode.getMessage()));
    }

    /**
     * DTO @Valid 검증 실패
     * ex) 필수값 누락, 형식 오류
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult()
                .getFieldErrors()
                .get(0)
                .getDefaultMessage();
        log.warn("[ValidationException] message={}", message);
        return ResponseEntity
                .badRequest()
                .body(new ErrorResponse("VALID001", message));
    }

    /**
     * 존재하지 않는 API 경로 요청
     * ex) GET /api/nonexistent
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFoundException(NoResourceFoundException e) {
        log.warn("[NoResourceFoundException] message={}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "존재하지 않는 경로입니다."));
    }

    /**
     * 잘못된 JSON 형식 또는 잘못된 ENUM body 값
     * ex) body=not-json, category="INVALID"
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(HttpMessageNotReadableException e) {
        log.warn("[HttpMessageNotReadableException] message={}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("BAD_REQUEST", "잘못된 요청입니다."));
    }

    /**
     * 잘못된 쿼리 파라미터 ENUM 값
     * ex) ?sortType=INVALID
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e) {
        log.warn("[MethodArgumentTypeMismatchException] message={}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("BAD_REQUEST", "잘못된 파라미터입니다."));
    }

    /**
     * @Validated @RequestParam 검증 실패
     * ex) invitedCnt=-1 (@Min(0) 위반)
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(ConstraintViolationException e) {
        String message = e.getConstraintViolations().iterator().next().getMessage();
        log.warn("[ConstraintViolationException] message={}", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("VALID001", message));
    }

    /**
     * 예상 못한 서버 에러
     * Sentry 연동 후 자동 리포팅 예정
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("[Exception] message={}", e.getMessage(), e);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(
                        ErrorCode.INTERNAL_SERVER_ERROR.getCode(),
                        ErrorCode.INTERNAL_SERVER_ERROR.getMessage()
                ));
    }
}
