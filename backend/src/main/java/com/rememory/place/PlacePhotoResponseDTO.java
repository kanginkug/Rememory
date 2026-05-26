package com.rememory.place;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PlacePhotoResponseDTO {

    private Long placePhotoId;
    private String imageUrl;

    public static PlacePhotoResponseDTO from(PlacePhoto placePhoto) {
        return new PlacePhotoResponseDTO(
                placePhoto.getId(),
                placePhoto.getImageUrl()
        );
    }
}