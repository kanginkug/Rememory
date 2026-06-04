package com.rememory.review;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class CreateReviewPhotoRequestDTO {
    @NotEmpty
    private List<String> photoUrlList;
}
