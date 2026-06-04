package com.rememory.review;

import com.rememory.member.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReviewPhoto {
    @Id
    @GeneratedValue
    @Column(name = "review_photo_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id")
    private Review review;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    private String imageUrl;

    private LocalDateTime createAt;

    private LocalDateTime deletedAt;

    public static ReviewPhoto create(Review review, Member member, String imageUrl) {
        ReviewPhoto reviewPhoto = new ReviewPhoto();
        reviewPhoto.review = review;
        reviewPhoto.member = member;
        reviewPhoto.imageUrl = imageUrl;
        return reviewPhoto;
    }

    @PrePersist
    protected void onCreate() {
        this.createAt = LocalDateTime.now();
    }

    public void update(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }
}
