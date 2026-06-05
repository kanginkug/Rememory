package com.rememory.review;

import com.rememory.place.Category;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class ReviewDetailResponseDTO {
    private Long reviewId;
    private Long memberId;
    private String memberName;
    private BigDecimal rating;
    private String content;
    private String placeName;
    private Category placeCategory;
    private List<ReviewPhotoResponseDTO> rpResponseDTOList;
    private String memoryName;
    private LocalDate visitedAt;
    private LocalDateTime createdAt;

    public static ReviewDetailResponseDTO from(Review review, List<ReviewPhotoResponseDTO> rpResponseDTOList) {
        return new ReviewDetailResponseDTO(
          review.getId(),
          review.getMember().getId(),
          review.getMember().getName(),
          review.getRating(),
          review.getContent(),
          review.getPlace().getName(),
          review.getPlace().getCategory(),
          rpResponseDTOList,
          review.getPlace().getMemory().getName(),
          review.getVisitedAt(),
          review.getCreatedAt()
        );
    }
}
