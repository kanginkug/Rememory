package com.rememory.place;

import com.rememory.member.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PlacePhoto {

    @Id
    @GeneratedValue
    @Column(name = "place_photo_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id")
    private Place place;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member creator;

    private String imageUrl;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;

    public static PlacePhoto create(Place place, Member creator, String imageUrl) {
        PlacePhoto placePhoto = new PlacePhoto();
        placePhoto.place = place;
        placePhoto.creator = creator;
        placePhoto.imageUrl = imageUrl;
        return placePhoto;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }
}
