package com.rememory.review;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class UpdateReviewRequestDTO {

    @NotNull
    private Long placeId;

    @NotNull
    private Long memoryId;

    @NotNull
    @DecimalMin("0.5")
    @DecimalMax("5.0")
    private BigDecimal rating;

    @Size(max = 1000)
    private String content;

    private LocalDate visitedAt;
}
