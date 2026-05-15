package com.rememory.invitation;

import com.rememory.member.Member;
import com.rememory.memory.Memory;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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
    private int maxUses;

    // 현재 사용 횟수
    private int usedCount;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    public static Invitation create(Memory memory, Member inviter, int maxUses) {
        Invitation invitation = new Invitation();
        invitation.memory = memory;
        invitation.inviter = inviter;
        invitation.inviteCode = UUID.randomUUID().toString();
        invitation.maxUses = maxUses;
        invitation.usedCount = 0;
        return invitation;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusDays(7);
    }

    public void plusUsedCount(){
        this.usedCount++;
    }
}
