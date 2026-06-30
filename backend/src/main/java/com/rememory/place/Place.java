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
        name = "place"
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

    @Column(columnDefinition = "TEXT")
    private String description;

    //식당, 숙소, 관광지
    // RESTAURANT, ACCOMMODATION, ATTRACTION
    @Enumerated(EnumType.STRING)
    private Category category;

    private String address;

    private String detailAddress;

    @Column(nullable = true)
    private String kakaoPlaceId; // 해외는 NULL 가능

    private String kakaoPlaceName;

    private BigDecimal latitude;

    private BigDecimal longitude;

    // 별점 평균
    private BigDecimal avgRating;

    // 리뷰 수
    private int reviewCount;

    // (시/도) ex : 서울
    private String regionDepth1;

    // (시/군/구) ex : 마포구
    private String regionDepth2;

    private LocalDate visitedAt;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;

    /** 정적 팩토리: 신규 장소 생성, 초기 통계(avgRating=0, reviewCount=0) 설정 */
    public static Place create(Memory memory, Member creator, String name, String description, Category category, String address, String detailAddress, String kakaoPlaceId, String kakaoPlaceName,
                           BigDecimal latitude, BigDecimal longitude, String regionDepth1, String regionDepth2, LocalDate visitedAt) {
        Place place = new Place();
        place.memory = memory;
        place.creator = creator;
        place.name = name;
        place.description = description;
        place.category = category;
        place.address = address;
        place.detailAddress = detailAddress;
        place.kakaoPlaceId = kakaoPlaceId;
        place.kakaoPlaceName = kakaoPlaceName;
        place.latitude = latitude;
        place.longitude = longitude;
        place.avgRating = BigDecimal.ZERO;
        place.regionDepth1 = regionDepth1;
        place.regionDepth2 = regionDepth2;
        place.visitedAt = visitedAt;
        place.reviewCount = 0;
        return place;
    }

    /** 장소 기본 정보 수정 */
    public void update(String name, String description, Category category, String address, String detailAddress, String kakaoPlaceId, String kakaoPlaceName,
                       BigDecimal latitude, BigDecimal longitude, String regionDepth1, String regionDepth2, LocalDate visitedAt) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.address = address;
        this.detailAddress = detailAddress;
        this.kakaoPlaceId = kakaoPlaceId;
        this.kakaoPlaceName = kakaoPlaceName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.regionDepth1 = regionDepth1;
        this.regionDepth2 = regionDepth2;
        this.visitedAt = visitedAt;
    }

    /** 최초 저장 시 생성일 자동 세팅 */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    /** Soft delete: 장소 삭제 처리 */
    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }
}
