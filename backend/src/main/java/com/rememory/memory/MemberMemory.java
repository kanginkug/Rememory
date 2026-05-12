package com.rememory.memory;

import com.rememory.member.Member;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Getter
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

}
