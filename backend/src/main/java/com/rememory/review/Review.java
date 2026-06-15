package com.rememory.review;

import com.rememory.member.Member;
import com.rememory.place.Place;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review {

    @Id
    @GeneratedValue
    @Column(name = "review_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id")
    private Place place;

    // 별점
    private BigDecimal rating;

    private String content;

    private LocalDate visitedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    /** 정적 팩토리: 신규 후기 생성 */
    public static Review create(Member member, Place place, BigDecimal rating, String content, LocalDate visitedAt) {
        Review review = new Review();
        review.member = member;
        review.place = place;
        review.rating = rating;
        review.content = content;
        review.visitedAt = visitedAt;

        return review;
    }

    /** 후기 내용·별점 수정, updatedAt 자동 갱신 */
    public void update(BigDecimal rating, String content, LocalDate visitedAt) {
        this.rating = rating;
        this.content = content;
        this.visitedAt = visitedAt;
        this.updatedAt = LocalDateTime.now();
    }

    /** 최초 저장 시 생성일 자동 세팅 */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    /** Soft delete: 후기 삭제 처리 */
    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }
}
