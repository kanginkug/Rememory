package com.rememory.memory;

import jakarta.persistence.*;
import lombok.Getter;

import java.text.DecimalFormat;
import java.time.LocalDateTime;

@Entity
@Getter
public class Memory {

    @Id
    @GeneratedValue
    @Column(name = "memory_id")
    private Long id;

    @OneToOne
    private Long groupId;

    @ManyToOne
    private Long memberId;

    private String name;

    private DecimalFormat avtRating;

    private int memoryReviewCount;

    private int starReviewCount;

    private String description;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;
}
