package com.rememory.review;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DeleteReviewRequestDTO {
    @NotNull
    private Long memoryId;

    @NotNull
    private Long reviewId;

    @NotNull
    private Long placeId;
}
