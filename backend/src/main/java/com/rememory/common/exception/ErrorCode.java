package com.rememory.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // ===== Member =====
    MEMBER_NOT_FOUND("M001", "존재하지 않는 회원입니다."),
    MEMBER_ALREADY_DELETED("M002", "이미 탈퇴한 회원입니다."),

    // ===== Memory =====
    MEMORY_NOT_FOUND("MM001", "존재하지 않는 메모리입니다."),
    MEMORY_ACCESS_DENIED("MM002", "접근 권한이 없습니다."),
    MEMORY_NOT_CREATOR("MM003", "메모리 생성자만 가능합니다."),
    MEMORY_PHOTO_NOT_FOUND("MM004", "메모리 사진이 존재하지 않습니다."),

    // ===== MemberMemory =====
    MEMBER_MEMORY_ALREADY_EXISTS("MME001", "이미 참가한 메모리입니다."),
    MEMBER_MEMORY_NOT_FOUND("MME002", "메모리 멤버가 아닙니다."),

    // ===== Invitation =====
    INVITATION_NOT_FOUND("I001", "존재하지 않는 초대 링크입니다."),
    INVITATION_EXPIRED("I002", "만료된 초대 링크입니다."),
    INVITATION_MAX_USES_EXCEEDED("I003", "초대 링크 사용 횟수를 초과했습니다."),

    // ===== Place =====
    PLACE_NOT_FOUND("P001", "존재하지 않는 장소입니다."),
    PLACE_ACCESS_DENIED("P002", "장소에 접근 권한이 없습니다."),
    PLACE_PHOTO_NOT_FOUND("P003", "장소 사진이 존재하지 않습니다."),
    PLACE_PHOTO_ACCESS_DENIED("P004", "장소 사진에 접근 권한이 없습니다."),

    // ===== Review =====
    REVIEW_NOT_FOUND("R001", "존재하지 않는 후기입니다."),
    REVIEW_ALREADY_EXISTS("R002", "이미 후기를 작성했습니다."),
    REVIEW_NOT_OWNER("R003", "후기 작성자만 가능합니다."),

    // ===== Server =====
    INTERNAL_SERVER_ERROR("S001", "서버 오류가 발생했습니다.");

    private final String code;
    private final String message;
}
