package com.rememory.group;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Getter
public class MemberGroup {

    @Id
    @GeneratedValue
    @Column(name = "member_group_id")
    private Long id;

    @OneToMany
    private Long memberId;

    @OneToMany
    private Long groupId;

    // OWNER, ADMIN, MEMBER
    @Enumerated(EnumType.STRING)
    private Role role;

    private LocalDateTime joinedAt;

    private LocalDateTime leftAt;
}
