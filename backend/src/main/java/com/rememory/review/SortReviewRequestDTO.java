package com.rememory.review;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SortReviewRequestDTO {

    @NotNull
    private SortTypeReview sortTypeReview;
}
