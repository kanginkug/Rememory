package com.rememory.place;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class PlacePhotoResponseDTO {

    private Long placePhotoId;
    private String imageUrl;
    private LocalDateTime createdAt;

    public static PlacePhotoResponseDTO from(PlacePhoto placePhoto) {
        return new PlacePhotoResponseDTO(
                placePhoto.getId(),
                placePhoto.getImageUrl(),
                placePhoto.getCreatedAt()
        );
    }
}