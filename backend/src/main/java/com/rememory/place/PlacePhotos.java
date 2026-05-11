package com.rememory.place;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Getter
public class PlacePhotos {

    @Id
    @GeneratedValue
    @Column(name = "place_photo_id")
    private Long id;

    @OneToMany
    private Long placeId;

    @OneToMany
    private Long creatorId;

    private String imageUrl;

    private int displayOrder;

    private LocalDateTime deletedAt;
}
