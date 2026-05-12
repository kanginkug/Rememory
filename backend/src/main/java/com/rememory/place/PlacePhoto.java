package com.rememory.place;

import com.rememory.member.Member;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Getter
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

    private int displayOrder;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;
}
