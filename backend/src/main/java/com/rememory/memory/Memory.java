package com.rememory.memory;

import com.rememory.member.Member;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
public class Memory {

    @Id
    @GeneratedValue
    @Column(name = "memory_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private Member creator;

    private String name;

    private BigDecimal avgRating;

    private int placeCount;

    // 신규 멤버에게 과거 공개 여부
    @Column(nullable = false)
    private Boolean showHistoryToNew = true;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;
}
