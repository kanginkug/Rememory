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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {
    private final MemberRepository memberRepository;
    private final MemoryRepository memoryRepository;
    private final MemberMemoryRepository mmRepository;
    private final PlaceRepository placeRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewPhotoRepository rpRepository;

    /**
     * 후기 작성
     * 1인 1후기 체크 → Review INSERT → Place avgRating 갱신 → Memory avgRating 재계산
     */
    @Transactional
    public void save(Long creatorId, CreateUpdateReviewRequestDTO cuReviewRequestDTO) {
        Long memoryId = cuReviewRequestDTO.getMemoryId();
        Long placeId = cuReviewRequestDTO.getPlaceId();

        Member creator = memberRepository.findOne(creatorId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if(mmRepository.findActiveByMemoryIdAndMemberId(memoryId, creatorId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        // 1인 1후기 중복 체크
        if(reviewRepository.findByPlaceIdAndMemberId(placeId, creatorId).isPresent()) {
            throw new BusinessException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        Place place = placeRepository.findOne(memoryId, placeId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));

        Review review = Review.create(creator, place, cuReviewRequestDTO.getRating(), cuReviewRequestDTO.getContent(), cuReviewRequestDTO.getVisitedAt());
        reviewRepository.save(review);

        if(cuReviewRequestDTO.getPhotoUrlList() != null && !cuReviewRequestDTO.getPhotoUrlList().isEmpty()){
            saveReviewPhoto(memoryId, creatorId, review.getId(), cuReviewRequestDTO.getPhotoUrlList());
        }

        placeRepository.updateRatingOnCreate(placeId, cuReviewRequestDTO.getRating());
        memoryRepository.recalculateRating(memoryId);
    }

    // 특정 장소에 대한 내 후기 단건 조회
    public ReviewDetailResponseDTO findMyReview(Long memoryId, Long memberId, Long placeId) {
        certification(memoryId, memberId);
        Review review = reviewRepository.findByPlaceIdAndMemberId(placeId, memberId).orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        List<ReviewPhoto> reviewPhotoList = rpRepository.findByReviewIdAndMemberId(review.getId(), memberId);
        List<ReviewPhotoResponseDTO> rpResponseDTOList = new ArrayList<>();
        for(ReviewPhoto reviewPhoto : reviewPhotoList) {
            rpResponseDTOList.add(ReviewPhotoResponseDTO.from(reviewPhoto));
        }
        return ReviewDetailResponseDTO.from(review, rpResponseDTOList);
    }

    // 특정 장소 전체 후기 조회
    public List<ReviewDetailResponseDTO> findAllByPlaceId(Long memoryId, Long memberId, Long placeId) {
        certification(memoryId, memberId);

        List<Review> reviewList = reviewRepository.findAllByPlaceId(placeId);
        return toResponseDTOList(reviewList);
    }

    // 정렬 타입 적용 후기 조회
    public List<ReviewDetailResponseDTO> sortByReviewType(Long memberId, Long memoryId, Long placeId, SortTypeReview sortTypeReview) {
        certification(memoryId, memberId);

        List<Review> reviewList = reviewRepository.sortByType(placeId, sortTypeReview);
        return toResponseDTOList(reviewList);
    }

    // 후기 수정 + Place·Memory 별점 재계산
    @Transactional
    public void updateReview(Long updater, Long reviewId, CreateUpdateReviewRequestDTO cuReviewRequestDTO) {
        Long memoryId = cuReviewRequestDTO.getMemoryId();
        Long placeId = cuReviewRequestDTO.getPlaceId();

        certification(memoryId, updater);
        Review review = reviewRepository.findOne(reviewId).orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        if (!review.getMember().getId().equals(updater)) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_OWNER);
        }
        BigDecimal oldRating = review.getRating();
        review.update(cuReviewRequestDTO.getRating(), cuReviewRequestDTO.getContent(), cuReviewRequestDTO.getVisitedAt());
        placeRepository.updateRatingOnUpdate(placeId, cuReviewRequestDTO.getRating(), oldRating);
        memoryRepository.recalculateRating(memoryId);
    }

    // 후기 삭제 + Place·Memory 별점 재계산
    @Transactional
    public void deleteReview(Long deleter, Long reviewId, Long memoryId, Long placeId) {
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

    // 멤버·추억 존재 여부 및 추억 접근 권한 통합 검증
    private void certification(Long memoryId, Long memberId){
        if(memberRepository.findOne(memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        if(memoryRepository.findOne(memoryId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_FOUND);
        }

        if(mmRepository.findActiveByMemoryIdAndMemberId(memoryId, memberId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }
    }

    // Review 엔티티 리스트 → DTO 리스트 변환
    private List<ReviewDetailResponseDTO> toResponseDTOList(List<Review> reviewList) {
        List<Long> reviewIdList = reviewList.stream().map(Review::getId).toList();
        List<ReviewPhoto> reviewPhotoList = rpRepository.findAllByReviewIdList(reviewIdList);

        Map<Long, List<ReviewPhotoResponseDTO>> photoMap = reviewPhotoList.stream()
                .collect(groupingBy(
                        p -> p.getReview().getId(),
                        mapping(ReviewPhotoResponseDTO::from, toList())
                ));

        List<ReviewDetailResponseDTO> rdResponseDTOList = new ArrayList<>();
        for(Review review : reviewList) {
            List<ReviewPhotoResponseDTO> rpResponseDTOList = photoMap.getOrDefault(review.getId(), List.of());

            rdResponseDTOList.add(ReviewDetailResponseDTO.from(review, rpResponseDTOList));
        }

        return rdResponseDTOList;
    }

    // 최근 작성한 후기 조회
    public List<ReviewDetailResponseDTO> findRecentReview(Long memberId) {
        return toResponseDTOList(reviewRepository.findRecentReview(memberId));
    }

    // 리뷰 사진 업로드
    @Transactional
    public void saveReviewPhoto(Long memoryId, Long memberId, Long reviewId, List<String> photoUrlList) {
        Member member = memberRepository.findOne(memberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if(mmRepository.findActiveByMemoryIdAndMemberId(memoryId, memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        if (photoUrlList != null && !photoUrlList.isEmpty()) {
            Review review = reviewRepository.findOne(reviewId).orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
            if(!review.getMember().getId().equals(memberId)) {
                throw new BusinessException(ErrorCode.REVIEW_PHOTO_ACCESS_DENIED);
            }

            if(rpRepository.findCountByReviewId(reviewId) + photoUrlList.size() > 3) {
                throw new BusinessException(ErrorCode.REVIEW_PHOTO_MAX_COUNT);
            }

            for(String photoUrl : photoUrlList) {
                ReviewPhoto reviewPhoto = ReviewPhoto.create(review, member, photoUrl);
                rpRepository.save(reviewPhoto);
            }
        } else {
            throw new BusinessException(ErrorCode.PHOTO_NOT_FOUND);
        }

    }

    // 리뷰 사진 삭제
    @Transactional
    public void deleteReviewPhoto(Long memoryId, Long memberId, Long reviewId, List<Long> reviewPhotoIdList){
        if(memberRepository.findOne(memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }
        if(mmRepository.findActiveByMemoryIdAndMemberId(memoryId, memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }
        if (reviewPhotoIdList != null && !reviewPhotoIdList.isEmpty()) {
            Review review = reviewRepository.findOne(reviewId).orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));

            if(!review.getMember().getId().equals(memberId)) {
                throw new BusinessException(ErrorCode.REVIEW_PHOTO_ACCESS_DENIED);
            }

            for(Long id : reviewPhotoIdList) {
                ReviewPhoto reviewPhoto = rpRepository.findOne(id).orElseThrow(() -> new BusinessException(ErrorCode.DELETE_PHOTO_NOT_FOUND));
                reviewPhoto.delete();
            }
        }

    }
}
