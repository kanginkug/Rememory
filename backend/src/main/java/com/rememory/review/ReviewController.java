package com.rememory.review;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // 후기 작성 (1인 1후기, 사진 선택)
    @PostMapping
    public ResponseEntity<Void> createReview(@RequestAttribute("memberId") Long memberId, @RequestBody @Valid CreateUpdateReviewRequestDTO cuReviewRequestDTO) {
        reviewService.save(memberId, cuReviewRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // 특정 장소에 대한 내 후기 단건 조회
    @GetMapping("/memory/{memoryId}/place/{placeId}")
    public ResponseEntity<ReviewDetailResponseDTO> findMyReviewByPlaceId(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId) {
        return ResponseEntity.ok(reviewService.findMyReview(memoryId, memberId, placeId));
    }

    // 최근 작성한 후기 조회
    @GetMapping("/recent")
    public ResponseEntity<List<ReviewDetailResponseDTO>> findRecentReview(@RequestAttribute("memberId") Long memberId) {
        return ResponseEntity.ok(reviewService.findRecentReview(memberId));
    }

    // 특정 장소 전체 후기 조회
    @GetMapping("/memory/{memoryId}/place/{placeId}/all")
    public ResponseEntity<List<ReviewDetailResponseDTO>> findReviewByPlaceId(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId) {
        return ResponseEntity.ok(reviewService.findAllByPlaceId(memoryId, memberId, placeId));
    }

    // 정렬 타입별 후기 조회
    @GetMapping("/memory/{memoryId}/place/{placeId}/sort")
    public ResponseEntity<List<ReviewDetailResponseDTO>> sortByReviewType(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId,@PathVariable("placeId") Long placeId, @RequestParam SortTypeReview sortTypeReview) {
        return ResponseEntity.ok(reviewService.sortByReviewType(memberId, memoryId, placeId, sortTypeReview));
    }

    // 후기 수정 + 별점 재계산
    @PutMapping("/{reviewId}")
    public ResponseEntity<Void> updateReview(@RequestAttribute("memberId") Long memberId, @PathVariable("reviewId") Long reviewId, @RequestBody @Valid CreateUpdateReviewRequestDTO cuReviewRequestDTO) {
        reviewService.updateReview(memberId, reviewId, cuReviewRequestDTO);
        return ResponseEntity.noContent().build();
    }

    // 후기 삭제 + 별점 재계산
    @DeleteMapping("/memory/{memoryId}/place/{placeId}/review/{reviewId}")
    public ResponseEntity<Void> deleteReview(@RequestAttribute("memberId") Long memberId, @PathVariable("reviewId") Long reviewId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId) {
        reviewService.deleteReview(memberId, reviewId, memoryId, placeId);
        return ResponseEntity.noContent().build();
    }

    // 이미지 생성
    @PostMapping("/{memoryId}/{reviewId}/photo")
    public ResponseEntity<Void> saveReviewPhoto(@RequestAttribute("memberId") Long memberId, @PathVariable("reviewId") Long reviewId, @PathVariable("memoryId") Long memoryId, @RequestBody @Valid CreateReviewPhotoRequestDTO createReviewPhotoRequestDTO) {
        reviewService.saveReviewPhoto(memoryId, memberId, reviewId, createReviewPhotoRequestDTO.getPhotoUrlList());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // 이미지 제거
    @DeleteMapping("/{memoryId}/{reviewId}/photo")
    public ResponseEntity<Void> deleteReviewPhoto(@RequestAttribute("memberId") Long memberId, @PathVariable("reviewId") Long reviewId, @PathVariable("memoryId") Long memoryId, @RequestBody @Valid DeleteReviewPhotoRequestDTO deleteReviewPhotoRequestDTO) {
        reviewService.deleteReviewPhoto(memoryId, memberId, reviewId, deleteReviewPhotoRequestDTO.getReviewPhotoIdList());
        return ResponseEntity.noContent().build();
    }
}
