package com.rememory.place;

import com.rememory.member.Member;
import com.rememory.memory.Memory;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Table(
        name = "place",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_place_kakao",
                columnNames = {"memory_id", "kakao_place_id"}
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Place {

    @Id
    @GeneratedValue
    @Column(name = "place_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memory_id")
    private Memory memory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private Member creator;

    private String name;

    //식당, 숙소, 관광지
    // RESTAURANT, ACCOMMODATION, ATTRACTION
    @Enumerated(EnumType.STRING)
    private Category category;

    private String address;

    @Column(nullable = true)
    private String kakaoPlaceId; // 해외는 NULL 가능

    private BigDecimal latitude;

    private BigDecimal longitude;

    // 별점 평균
    private BigDecimal avgRating;

    private int reviewCount;

    // (시/도) ex : 서울
    private String region_depth1;

    // (시/군/구) ex : 마포구
    private String region_depth2;

    private LocalDate visitedAt;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;

    public static Place create(Memory memory, Member creator, String name, Category category, String address, String kakaoPlaceId,
                           BigDecimal latitude, BigDecimal longitude, BigDecimal avgRating, int reviewCount, String region_depth1, String region_depth2, LocalDate visitedAt) {
        Place place = new Place();
        place.memory = memory;
        place.creator = creator;
        place.name = name;
        place.category = category;
        place.address = address;
        place.kakaoPlaceId = kakaoPlaceId;
        place.latitude = latitude;
        place.longitude = longitude;
        place.avgRating = avgRating;
        place.reviewCount = reviewCount;
        place.region_depth1 = region_depth1;
        place.region_depth2 = region_depth2;
        place.visitedAt = visitedAt;
        return place;
    }

    public void update(String name, Category category, String address, String kakaoPlaceId,
                       BigDecimal latitude, BigDecimal longitude, String region_depth1, String region_depth2, LocalDate visitedAt) {
        this.name = name;
        this.category = category;
        this.address = address;
        this.kakaoPlaceId = kakaoPlaceId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.region_depth1 = region_depth1;
        this.region_depth2 = region_depth2;
        this.visitedAt = visitedAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }
}
