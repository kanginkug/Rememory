package com.rememory.review;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ReviewDetailResponseDTO {
    private Long memberId;
    private BigDecimal rating;
    private String content;
    private LocalDate visitedAt;
    private LocalDateTime createdAt;

    public static ReviewDetailResponseDTO from(Review review) {
        return new ReviewDetailResponseDTO(
          review.getMember().getId(),
          review.getRating(),
          review.getContent(),
          review.getVisitedAt(),
          review.getCreatedAt()
        );
    }
}
