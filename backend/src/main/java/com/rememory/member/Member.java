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

    @Column(unique = true, nullable = false)
    private String email;

    private String profileImageUrl;

    /**
     * 로그인 제공자
     * ex) KAKAO 로그인, GOOGLE 로그인
     */
    private String oauthProvider;

    private String oauthId;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;

    public static Member create(String name, String email, String profileImageUrl, String oauthProvider, String oauthId) {
        Member member = new Member();
        member.name = name;
        member.email = email;
        member.profileImageUrl = profileImageUrl;
        member.oauthProvider = oauthProvider;
        member.oauthId = oauthId;
        return member;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }
}
