package com.rememory.review;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;


@Getter
@AllArgsConstructor
public class ReviewPhotoResponseDTO {
    private Long reviewPhotoId;
    private String photoUrl;
    private LocalDateTime createdAt;

    public static ReviewPhotoResponseDTO from(ReviewPhoto reviewPhoto) {
        return new ReviewPhotoResponseDTO(
            reviewPhoto.getId(),
            reviewPhoto.getImageUrl(),
            reviewPhoto.getCreatedAt()
        );
    }
}
