package com.rememory.place;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class PlaceMapResponseDTO {
    private Long memoryId;
    private String memoryName;
    private Long placeId;
    private String placeName;
    private Category category;
    private BigDecimal latitude;
    private BigDecimal longitude;
    // 별점 평균
    private BigDecimal avgRating;
    // (시/도) ex : 서울
    private String regionDepth1;
    // (시/군/구) ex : 마포구
    private String regionDepth2;
    private LocalDate visitedAt;

    public static PlaceMapResponseDTO from(Place place) {
        return new PlaceMapResponseDTO(
                place.getMemory().getId(),
                place.getMemory().getName(),
                place.getId(),
                place.getName(),
                place.getCategory(),
                place.getLatitude(),
                place.getLongitude(),
                place.getAvgRating(),
                place.getRegionDepth1(),
                place.getRegionDepth2(),
                place.getVisitedAt()
        );
    }
}
