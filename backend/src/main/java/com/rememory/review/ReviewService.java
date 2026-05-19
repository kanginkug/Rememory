package com.rememory.review;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.memory.MemberMemoryRepository;
import com.rememory.memory.MemoryRepository;
import com.rememory.place.Place;
import com.rememory.place.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {
    private final MemberRepository memberRepository;
    private final MemoryRepository memoryRepository;
    private final MemberMemoryRepository mmRepository;
    private final PlaceRepository placeRepository;
    private final ReviewRepository reviewRepository;

    /**
     * 후기 작성
     * 1인 1후기 체크 → Review INSERT → Place avgRating 갱신 → Memory avgRating 재계산
     */
    @Transactional
    public void save(Long memoryId, Long creatorId, Long placeId, CreateUpdateReviewRequestDTO cuReviewRequestDTO) {
        Member creator = memberRepository.findOne(creatorId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if(mmRepository.findByMemoryIdAndMemberId(memoryId, creatorId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        // 1인 1후기 중복 체크
        if(reviewRepository.findByPlaceIdAndMemberId(placeId, creatorId).isPresent()) {
            throw new BusinessException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        Place place = placeRepository.findOne(memoryId, placeId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));

        Review review = Review.create(creator, place, cuReviewRequestDTO.getRating(), cuReviewRequestDTO.getContent(), cuReviewRequestDTO.getVisitedAt());
        reviewRepository.save(review);
        placeRepository.updateRatingOnCreate(placeId, cuReviewRequestDTO.getRating());
        memoryRepository.recalculateRating(memoryId);
    }

    public Review findMyReview(Long memoryId, Long memberId, Long placeId) {
        if(memoryRepository.findOne(memoryId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_FOUND);
        }

        if(mmRepository.findByMemoryIdAndMemberId(memoryId, memberId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        return reviewRepository.findByPlaceIdAndMemberId(placeId, memberId).orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
    }

    public List<Review> findAllByPlaceId(Long memoryId, Long memberId, Long placeId) {
        if(memoryRepository.findOne(memoryId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_FOUND);
        }

        if(mmRepository.findByMemoryIdAndMemberId(memoryId, memberId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        return reviewRepository.findAllByPlaceId(placeId);
    }

    public List<Review> sortByReviewType(Long memoryId, Long memberId, Long placeId, SortReviewRequestDTO srRequestDTO) {
        if(memoryRepository.findOne(memoryId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_FOUND);
        }

        if(mmRepository.findByMemoryIdAndMemberId(memoryId, memberId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        return reviewRepository.sortByType(placeId, srRequestDTO.getSortTypeReview());
    }

    @Transactional
    public void updateReview(Long memoryId, Long updater, Long reviewId, Long PlaceId, CreateUpdateReviewRequestDTO cuReviewRequestDTO) {
        certification(memoryId, updater);
        Review review = reviewRepository.findOne(reviewId).orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        if (!review.getMember().getId().equals(updater)) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_OWNER);
        }
        BigDecimal oldRating = review.getRating();
        review.update(cuReviewRequestDTO.getRating(), cuReviewRequestDTO.getContent(), cuReviewRequestDTO.getVisitedAt());
        placeRepository.updateRatingOnUpdate(PlaceId, cuReviewRequestDTO.getRating(), oldRating);
        memoryRepository.recalculateRating(memoryId);
    }

    @Transactional
    public void deleteReview(Long memoryId, Long deleter, Long reviewId, Long placeId) {
        certification(memoryId, deleter);
        Review review = reviewRepository.findOne(reviewId).orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        if (!review.getMember().getId().equals(deleter)) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_OWNER);
        }
        BigDecimal oldRating = review.getRating();
        review.delete();
        placeRepository.updateRatingOnDelete(placeId, oldRating);
        memoryRepository.recalculateRating(memoryId);
    }

    private void certification(Long memoryId, Long memberId){
        if(memberRepository.findOne(memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        if(memoryRepository.findOne(memoryId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_FOUND);
        }

        if(mmRepository.findByMemoryIdAndMemberId(memoryId, memberId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }
    }
}
