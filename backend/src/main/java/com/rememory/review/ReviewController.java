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

    @PostMapping
    public ResponseEntity<Void> createReview(@RequestAttribute("memberId") Long memberId, @RequestBody @Valid CreateUpdateReviewRequestDTO cuReviewRequestDTO) {
        reviewService.save(memberId, cuReviewRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/memory/{memoryId}/place/{placeId}")
    public ResponseEntity<ReviewDetailResponseDTO> findMyReviewByPlaceId(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId) {
        return ResponseEntity.ok(reviewService.findMyReview(memoryId, memberId, placeId));
    }

    @GetMapping("/memory/{memoryId}/place/{placeId}/all")
    public ResponseEntity<List<ReviewDetailResponseDTO>> findReviewByPlaceId(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId) {
        return ResponseEntity.ok(reviewService.findAllByPlaceId(memoryId, memberId, placeId));
    }

    @GetMapping("/memory/{memoryId}/place/{placeId}/sort")
    public ResponseEntity<List<ReviewDetailResponseDTO>> sortByReviewType(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId,@PathVariable("placeId") Long placeId, @RequestParam SortTypeReview sortTypeReview) {
        return ResponseEntity.ok(reviewService.sortByReviewType(memberId, memoryId, placeId, sortTypeReview));
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<Void> updateReview(@RequestAttribute("memberId") Long memberId, @PathVariable("reviewId") Long reviewId, @RequestBody @Valid CreateUpdateReviewRequestDTO cuReviewRequestDTO) {
        reviewService.updateReview(memberId, reviewId, cuReviewRequestDTO);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/memory/{memoryId}/place/{placeId}/review/{reviewId}")
    public ResponseEntity<Void> deleteReview(@RequestAttribute("memberId") Long memberId, @PathVariable("reviewId") Long reviewId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId) {
        reviewService.deleteReview(memberId, reviewId, memoryId, placeId);
        return ResponseEntity.noContent().build();
    }
}
