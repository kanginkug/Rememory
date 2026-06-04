package com.rememory.review;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ReviewPhotoResponseDTO {
    private Long reviewPhotoId;
    private String photoUrl;

    public static ReviewPhotoResponseDTO from(ReviewPhoto reviewPhoto) {
        return new ReviewPhotoResponseDTO(
            reviewPhoto.getId(),
            reviewPhoto.getImageUrl()
        );
    }
}
