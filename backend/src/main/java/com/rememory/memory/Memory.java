package com.rememory.memory;

import com.rememory.member.Member;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
public class Memory {

    @Id
    @GeneratedValue
    @Column(name = "memory_id")
    private Long id;

    @OneToMany
    @JoinColumn(name = "member_id")
    private Member member;

    private String name;

    private BigDecimal avtRating;

    private int memoryReviewCount;

    private int starReviewCount;

    private String description;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;
}
