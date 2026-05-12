package com.rememory.member;

import jakarta.persistence.*;
import lombok.Getter;

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
}
