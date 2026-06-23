package com.rememory.member;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@Table(
    name = "member",
    uniqueConstraints = @UniqueConstraint(
            name = "uk_oauth",
            columnNames = {"oauth_provider", "oauth_id"}
    )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {

    @Id
    @GeneratedValue
    @Column(name = "member_id")
    private Long id;

    private String name;

    private String email;

    private String profileImageUrl;

    /**
     * 로그인 제공자
     * ex) KAKAO 로그인, GOOGLE 로그인
     */
    private String oauthProvider;

    private String oauthId;

    private String refreshToken;

    private LocalDateTime refreshTokenExpiresAt;

    private String fcmToken;

    private boolean notificationEnabled = true;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;

    /** 정적 팩토리: 신규 회원 생성 */
    public static Member create(String name, String email, String profileImageUrl, String oauthProvider, String oauthId, String refreshToken, LocalDateTime refreshTokenExpiresAt) {
        Member member = new Member();
        member.name = name;
        member.email = email;
        member.profileImageUrl = profileImageUrl;
        member.oauthProvider = oauthProvider;
        member.oauthId = oauthId;
        member.refreshToken = refreshToken;
        member.refreshTokenExpiresAt = refreshTokenExpiresAt;
        return member;
    }

    /** 최초 저장 시 생성일 자동 세팅 */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    /** Soft delete: 탈퇴 처리 */
    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    /** 탈퇴 취소 시 계정 복구 */
    public void restore() {
        this.deletedAt = null;
    }

    /** 닉네임 변경 */
    public void updateInfo(String name) {
        this.name = name;
    }

    /** 프로필 이미지 URL 변경 */
    public void updateProfileImg(String imageUrl) {
        this.profileImageUrl = imageUrl;
    }

    /** refreshToken 정보 수정 */
    public void updateRefreshToken(String refreshToken, LocalDateTime refreshTokenExpiresAt){
        this.refreshToken = refreshToken;
        this.refreshTokenExpiresAt = refreshTokenExpiresAt;
    }

    /** FCM 토큰 갱신 */
    public void updateFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }

    /** 알림 허용 여부 변경 */
    public void updateNotificationEnabled(boolean notificationEnabled) {
        this.notificationEnabled = notificationEnabled;
    }
}
