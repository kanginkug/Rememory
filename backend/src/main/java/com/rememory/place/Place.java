package com.rememory.place;

import jakarta.persistence.*;
import lombok.Getter;

import java.text.DecimalFormat;
import java.time.LocalDateTime;

@Entity
@Getter
public class Place {

    @Id
    @GeneratedValue
    @Column(name = "place_id")
    private Long id;

    @ManyToOne
    private Long memoryId;

    @ManyToOne
    private Long creatorId;

    private String name;

    //식당, 숙소, 관광지
    // RESTAURANT, ACCOMMODATION, ATTRACTION
    @Enumerated(EnumType.STRING)
    private Category category;

    private String address;

    private String kakaoPlaceId;

    private String latitude;

    private String longitude;

    private DecimalFormat avgRating;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;
}
