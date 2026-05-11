package com.rememory.member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Getter;
import org.springframework.context.annotation.Description;

import java.time.LocalDateTime;

@Entity
@Getter
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

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;
}
