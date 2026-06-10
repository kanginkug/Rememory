package com.rememory.place;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@AllArgsConstructor
public class PlaceBestResponseDTO {
    private Long id;
    private String name;
    private String description;
    private String memoryName;
    private Category category;
    private String address;
    private String kakaoPlaceId; // 해외는 NULL 가능
    private String kakaoPlaceName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal avgRating;
    private int reviewCount;
    // (시/도) ex : 서울
    private String regionDepth1;
    // (시/군/구) ex : 마포구
    private String regionDepth2;
    private LocalDate visitedAt;
    private Long memoryId;
    private List<PlacePhotoResponseDTO> placePhotoList;

    public static PlaceBestResponseDTO from(Place place, List<PlacePhotoResponseDTO> placePhotoList) {
        return new PlaceBestResponseDTO(
                place.getId(),
                place.getName(),
                place.getDescription(),
                place.getMemory().getName(),
                place.getCategory(),
                place.getAddress(),
                place.getKakaoPlaceId(),
                place.getKakaoPlaceName(),
                place.getLatitude(),
                place.getLongitude(),
                place.getAvgRating(),
                place.getReviewCount(),
                place.getRegionDepth1(),
                place.getRegionDepth2(),
                place.getVisitedAt(),
                place.getMemory().getId(),
                placePhotoList
        );
    }

    public static PlaceBestResponseDTO from(Place place) {
        return from(place, List.of());
    }
}
