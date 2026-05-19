package com.rememory.review;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
@Valid
public class CreateUpdateReviewRequestDTO {

    @NotNull
    private BigDecimal rating;

    private String content;

    @NotNull
    private LocalDate visitedAt;
}
