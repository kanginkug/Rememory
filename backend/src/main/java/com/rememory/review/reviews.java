package com.rememory.review;

import jakarta.persistence.*;
import lombok.Getter;

import java.text.DecimalFormat;
import java.time.LocalDateTime;

@Entity
@Getter
public class reviews {

    @Id
    @GeneratedValue
    @Column(name = "review_id")
    private Long id;

    @OneToMany
    private Long creatorId;

    @OneToMany
    private Long placeId;

    private DecimalFormat rating;

    private String content;

    private LocalDateTime visitedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}
