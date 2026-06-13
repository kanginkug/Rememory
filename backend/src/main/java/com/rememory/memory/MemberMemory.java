package com.rememory.memory;

import com.rememory.member.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberMemory {

    @Id
    @GeneratedValue
    @Column(name = "member_memory_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memory_id")
    private Memory memory;

    private LocalDateTime joinedAt;

    private LocalDateTime leftAt;

    /** 정적 팩토리: 추억 참여 기록 생성, 참여일 자동 세팅 */
    public static MemberMemory create(Member member, Memory memory) {
        MemberMemory memberMemory = new MemberMemory();
        memberMemory.member = member;
        memberMemory.memory = memory;
        memberMemory.joinedAt = LocalDateTime.now();
        return memberMemory;
    }

    /** leftAt이 null이면 활성 멤버, null이 아니면 나간 멤버 */
    public void leftMemory() {
        this.leftAt = LocalDateTime.now();
    }

    /** 재참여(나갔다가 재초대) 시 leftAt 초기화 */
    public void comebackMember() {this.leftAt = null;}
}
