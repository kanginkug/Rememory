package com.rememory.review;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class CreateUpdateReviewRequestDTO {

    @NotNull
    private Long placeId;

    @NotNull
    private Long memoryId;

    @NotNull
    private BigDecimal rating;

    private String content;

    @NotNull
    private LocalDate visitedAt;
}
