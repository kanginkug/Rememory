package com.rememory.invitation;

import com.rememory.member.Member;
import com.rememory.memory.Memory;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Getter
public class Invitation {

    @Id
    @GeneratedValue
    @Column(name = "invitation_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memory_id")
    private Memory memory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    // 초대한 사람
    private Member inviter;

    //UNIQUE 제약
    @Column(unique = true, nullable = false)
    private String inviteCode;

    // 최대 사용 횟수 (NULL = 무제한)
    @Column(nullable = true)
    private Integer maxUses;

    // 현재 사용 횟수
    @Column(nullable = false)
    private Integer usedCount = 0;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;
}
