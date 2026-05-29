package com.rememory.review;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ReviewDetailResponseDTO {
    private Long reviewId;
    private Long memberId;
    private BigDecimal rating;
    private String content;
    private String placeName;
    private String memoryName;
    private LocalDate visitedAt;
    private LocalDateTime createdAt;

    public static ReviewDetailResponseDTO from(Review review) {
        return new ReviewDetailResponseDTO(
          review.getId(),
          review.getMember().getId(),
          review.getRating(),
          review.getContent(),
          review.getPlace().getName(),
          review.getPlace().getMemory().getName(),
          review.getVisitedAt(),
          review.getCreatedAt()
        );
    }
}
