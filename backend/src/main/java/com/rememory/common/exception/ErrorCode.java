package com.rememory.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // ===== Member =====
    MEMBER_NOT_FOUND("M001", "존재하지 않는 회원입니다.", HttpStatus.BAD_REQUEST),
    MEMBER_ALREADY_DELETED("M002", "이미 탈퇴한 회원입니다.", HttpStatus.FORBIDDEN),

    // ===== Memory =====
    MEMORY_NOT_FOUND("MM001", "존재하지 않는 추억입니다.", HttpStatus.BAD_REQUEST),
    MEMORY_ACCESS_DENIED("MM002", "접근 권한이 없습니다.", HttpStatus.FORBIDDEN),
    MEMORY_NOT_CREATOR("MM003", "추억 생성자만 가능합니다.", HttpStatus.FORBIDDEN),
    MEMORY_PHOTO_NOT_FOUND("MM004", "추억 사진이 존재하지 않습니다.", HttpStatus.BAD_REQUEST),
    MEMORY_PHOTO_ALREADY_EXISTS("MM005", "이미 표지 사진이 존재합니다.", HttpStatus.CONFLICT),
    MEMORY_HAS_PLACES("MM006", "장소가 존재하기 때문에 추억을 삭제할 수 없습니다.", HttpStatus.CONFLICT),

    // ===== MemberMemory =====
    MEMBER_MEMORY_ALREADY_EXISTS("MME001", "이미 참가한 추억입니다.", HttpStatus.CONFLICT),
    MEMBER_MEMORY_NOT_FOUND("MME002", "추억 멤버가 아닙니다.", HttpStatus.FORBIDDEN),

    // ===== Invitation =====
    INVITATION_NOT_FOUND("I001", "존재하지 않는 초대 링크입니다.", HttpStatus.BAD_REQUEST),
    INVITATION_EXPIRED("I002", "만료된 초대 링크입니다.", HttpStatus.BAD_REQUEST),
    INVITATION_MAX_USES_EXCEEDED("I003", "초대 링크 사용 횟수를 초과했습니다.", HttpStatus.CONFLICT),

    // ===== Place =====
    PLACE_NOT_FOUND("P001", "존재하지 않는 장소입니다.", HttpStatus.BAD_REQUEST),
    PLACE_PHOTO_NOT_FOUND("P002", "장소 사진이 존재하지 않습니다.", HttpStatus.BAD_REQUEST),
    PLACE_PHOTO_ACCESS_DENIED("P003", "장소 사진에 접근 권한이 없습니다.", HttpStatus.FORBIDDEN),
    PLACE_HAS_REVIEWS("P004", "후기가 있는 장소는 삭제할 수 없습니다.", HttpStatus.CONFLICT),
    PLACE_PHOTO_MAX_COUNT("P005", "장소 이미지는 5장까지만 저장 가능합니다.", HttpStatus.CONFLICT),

    // ===== Review =====
    REVIEW_NOT_FOUND("R001", "존재하지 않는 후기입니다.", HttpStatus.BAD_REQUEST),
    REVIEW_ALREADY_EXISTS("R002", "이미 후기를 작성했습니다.", HttpStatus.CONFLICT),
    REVIEW_NOT_OWNER("R003", "후기 작성자만 가능합니다.", HttpStatus.FORBIDDEN),
    REVIEW_PHOTO_MAX_COUNT("R004", "후기 이미지는 3장까지만 저장 가능합니다.", HttpStatus.CONFLICT),
    REVIEW_PHOTO_ACCESS_DENIED("R005", "해당 후기 사진에 접근 권한이 없습니다.", HttpStatus.FORBIDDEN),

    // ===== Photo =====
    INVALID_FILE_TYPE("PT001", "이미지 파일만 업로드할 수 있습니다.", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED("PT002", "파일 업로드에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    PHOTO_NOT_FOUND("PT003", "업로드할 이미지가 존재하지 않습니다.", HttpStatus.BAD_REQUEST),
    DELETE_PHOTO_NOT_FOUND("PT004", "제거할 이미지가 존재하지 않습니다.", HttpStatus.BAD_REQUEST),

    // ===== Token =====
    TOKEN_EXPIRED("T001", "만료된 토큰입니다.", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID("T002", "유효하지 않은 토큰입니다.", HttpStatus.UNAUTHORIZED),
    TOKEN_MALFORMED("T003", "잘못된 형식의 토큰입니다.", HttpStatus.BAD_REQUEST),
    TOKEN_EMPTY("T004", "토큰이 없습니다.", HttpStatus.BAD_REQUEST),
    REFRESH_TOKEN_EXPIRED("T005", "리프레시 토큰이 만료됐습니다.", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_INVALID("T006", "유효하지 않은 리프레시 토큰입니다.", HttpStatus.BAD_REQUEST),

    // ===== Common =====
    INVALID_REQUEST("C001", "잘못된 요청입니다.", HttpStatus.BAD_REQUEST),

    // ===== Server =====
    INTERNAL_SERVER_ERROR("S001", "서버 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String message;
    private final HttpStatus status;
}
