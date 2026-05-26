package com.rememory.review;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.memory.MemberMemory;
import com.rememory.memory.MemberMemoryRepository;
import com.rememory.memory.Memory;
import com.rememory.memory.MemoryRepository;
import com.rememory.place.Category;
import com.rememory.place.Place;
import com.rememory.place.PlaceRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Transactional
class ReviewServiceTest {

    @Autowired ReviewService reviewService;
    @Autowired ReviewRepository reviewRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired MemoryRepository memoryRepository;
    @Autowired MemberMemoryRepository mmRepository;
    @Autowired PlaceRepository placeRepository;
    @PersistenceContext EntityManager em;

    private Member member;
    private Member otherMember;
    private Memory memory;
    private Place place;

    @BeforeEach
    void setUp() {
        member = Member.create("홍길동", "hong@gmail.com", "KAKAO", "kakao_111", "http://img/1");
        memberRepository.save(member);

        otherMember = Member.create("김철수", "kim@gmail.com", "KAKAO", "kakao_222", "http://img/2");
        memberRepository.save(otherMember);

        memory = Memory.create(member, "제주도 여행", "즐거운 여행",
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
        memoryRepository.save(memory);

        mmRepository.save(MemberMemory.create(member, memory));

        place = Place.create(memory, member, "흑돼지 맛집", Category.RESTAURANT,
                "제주시 어딘가", "kakao_001",
                BigDecimal.valueOf(33.4996), BigDecimal.valueOf(126.5312),
                "제주", "제주시",
                LocalDate.of(2026, 5, 2));
        placeRepository.save(place);
    }

    // ===== save =====

    @Test
    @DisplayName("리뷰 작성 성공")
    void save_성공() {
        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(4.5), "맛있어요"));

        Review review = reviewRepository.findByPlaceIdAndMemberId(place.getId(), member.getId()).get();
        assertThat(review.getRating()).isEqualByComparingTo(BigDecimal.valueOf(4.5));
        assertThat(review.getContent()).isEqualTo("맛있어요");
    }

    @Test
    @DisplayName("리뷰 작성 시 Place 평균 별점 갱신")
    void save_평균별점_갱신() {
        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(4.0), "맛있어요"));

        em.clear();
        Place updatedPlace = placeRepository.findOne(memory.getId(), place.getId()).get();
        assertThat(updatedPlace.getAvgRating()).isNotEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("1인 1후기 - 중복 작성 시 BusinessException 발생")
    void save_중복_예외발생() {
        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(4.5), "맛있어요"));

        assertThatThrownBy(() -> reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(3.0), "그냥 그래요")))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.REVIEW_ALREADY_EXISTS.getMessage());
    }

    @Test
    @DisplayName("추억 멤버가 아닌 사람이 리뷰 작성 시 BusinessException 발생")
    void save_비멤버_예외발생() {
        assertThatThrownBy(() -> reviewService.save(otherMember.getId(), createReviewDto(BigDecimal.valueOf(4.5), "맛있어요")))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("없는 장소에 리뷰 작성 시 BusinessException 발생")
    void save_없는장소_예외발생() {
        assertThatThrownBy(() -> reviewService.save(member.getId(),
                new CreateUpdateReviewRequestDTO(999999L, memory.getId(), BigDecimal.valueOf(4.5), "맛있어요", LocalDate.of(2026, 5, 2))))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.PLACE_NOT_FOUND.getMessage());
    }

    // ===== findMyReview =====

    @Test
    @DisplayName("내 리뷰 조회 성공")
    void findMyReview_성공() {
        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(4.5), "맛있어요"));

        ReviewDetailResponseDTO review = reviewService.findMyReview(memory.getId(), member.getId(), place.getId());
        assertThat(review).isNotNull();
        assertThat(review.getMemberId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("리뷰 없을 때 조회 시 BusinessException 발생")
    void findMyReview_없음_예외발생() {
        assertThatThrownBy(() -> reviewService.findMyReview(memory.getId(), member.getId(), place.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.REVIEW_NOT_FOUND.getMessage());
    }

    // ===== findAllByPlaceId =====

    @Test
    @DisplayName("장소 리뷰 전체 조회 성공")
    void findAllByPlaceId_성공() {
        mmRepository.save(MemberMemory.create(otherMember, memory));

        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(4.5), "맛있어요"));
        reviewService.save(otherMember.getId(), createReviewDto(BigDecimal.valueOf(3.0), "그냥 그래요"));

        List<ReviewDetailResponseDTO> reviews = reviewService.findAllByPlaceId(memory.getId(), member.getId(), place.getId());
        assertThat(reviews).hasSize(2);
    }

    @Test
    @DisplayName("삭제된 리뷰는 조회 안 됨")
    void findAllByPlaceId_삭제된리뷰_미조회() {
        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(4.5), "맛있어요"));
        Review review = reviewRepository.findByPlaceIdAndMemberId(place.getId(), member.getId()).get();

        reviewService.deleteReview(member.getId(), review.getId(), memory.getId(), place.getId());

        List<ReviewDetailResponseDTO> reviews = reviewService.findAllByPlaceId(memory.getId(), member.getId(), place.getId());
        assertThat(reviews).isEmpty();
    }

    // ===== sortByReviewType =====

    @Test
    @DisplayName("별점 높은순 정렬")
    void sortByReviewType_별점높은순() {
        mmRepository.save(MemberMemory.create(otherMember, memory));

        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(3.0), "보통이에요"));
        reviewService.save(otherMember.getId(), createReviewDto(BigDecimal.valueOf(5.0), "최고예요"));

        List<ReviewDetailResponseDTO> reviews = reviewService.sortByReviewType(memory.getId(), member.getId(), place.getId(), SortTypeReview.RATING_DESC);

        assertThat(reviews.get(0).getRating()).isEqualByComparingTo(BigDecimal.valueOf(5.0));
    }

    @Test
    @DisplayName("별점 낮은순 정렬")
    void sortByReviewType_별점낮은순() {
        mmRepository.save(MemberMemory.create(otherMember, memory));

        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(3.0), "보통이에요"));
        reviewService.save(otherMember.getId(), createReviewDto(BigDecimal.valueOf(5.0), "최고예요"));

        List<ReviewDetailResponseDTO> reviews = reviewService.sortByReviewType(memory.getId(), member.getId(), place.getId(), SortTypeReview.RATING_ASC);

        assertThat(reviews.get(0).getRating()).isEqualByComparingTo(BigDecimal.valueOf(3.0));
    }

    // ===== updateReview =====

    @Test
    @DisplayName("리뷰 수정 성공")
    void updateReview_성공() {
        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(4.5), "맛있어요"));
        Review review = reviewRepository.findByPlaceIdAndMemberId(place.getId(), member.getId()).get();

        reviewService.updateReview(member.getId(), review.getId(), createReviewDto(BigDecimal.valueOf(3.0), "생각보다 별로"));

        Review updated = reviewRepository.findOne(review.getId()).get();
        assertThat(updated.getRating()).isEqualByComparingTo(BigDecimal.valueOf(3.0));
        assertThat(updated.getContent()).isEqualTo("생각보다 별로");
    }

    @Test
    @DisplayName("리뷰 수정 시 Place 평균 별점 갱신")
    void updateReview_평균별점_갱신() {
        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(4.0), "맛있어요"));
        Review review = reviewRepository.findByPlaceIdAndMemberId(place.getId(), member.getId()).get();

        em.clear();
        BigDecimal beforeAvg = placeRepository.findOne(memory.getId(), place.getId()).get().getAvgRating();

        reviewService.updateReview(member.getId(), review.getId(), createReviewDto(BigDecimal.valueOf(2.0), "별로"));

        em.clear();
        BigDecimal afterAvg = placeRepository.findOne(memory.getId(), place.getId()).get().getAvgRating();
        assertThat(afterAvg).isNotEqualByComparingTo(beforeAvg);
    }

    @Test
    @DisplayName("본인 리뷰가 아닌 경우 수정 시 BusinessException 발생")
    void updateReview_본인아님_예외발생() {
        mmRepository.save(MemberMemory.create(otherMember, memory));
        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(4.5), "맛있어요"));
        Review review = reviewRepository.findByPlaceIdAndMemberId(place.getId(), member.getId()).get();

        assertThatThrownBy(() -> reviewService.updateReview(otherMember.getId(), review.getId(), createReviewDto(BigDecimal.valueOf(1.0), "별로")))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.REVIEW_NOT_OWNER.getMessage());
    }

    // ===== deleteReview =====

    @Test
    @DisplayName("리뷰 삭제 성공 - deletedAt 세팅")
    void deleteReview_성공() {
        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(4.5), "맛있어요"));
        Review review = reviewRepository.findByPlaceIdAndMemberId(place.getId(), member.getId()).get();

        reviewService.deleteReview(member.getId(), review.getId(), memory.getId(), place.getId());

        assertThat(reviewRepository.findOne(review.getId())).isEmpty();
    }

    @Test
    @DisplayName("리뷰 삭제 시 Place 평균 별점 갱신")
    void deleteReview_평균별점_갱신() {
        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(4.0), "맛있어요"));
        Review review = reviewRepository.findByPlaceIdAndMemberId(place.getId(), member.getId()).get();

        reviewService.deleteReview(member.getId(), review.getId(), memory.getId(), place.getId());

        em.clear();
        Place updatedPlace = placeRepository.findOne(memory.getId(), place.getId()).get();
        assertThat(updatedPlace.getReviewCount()).isEqualTo(0);
        assertThat(updatedPlace.getAvgRating()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("본인 리뷰가 아닌 경우 삭제 시 BusinessException 발생")
    void deleteReview_본인아님_예외발생() {
        mmRepository.save(MemberMemory.create(otherMember, memory));
        reviewService.save(member.getId(), createReviewDto(BigDecimal.valueOf(4.5), "맛있어요"));
        Review review = reviewRepository.findByPlaceIdAndMemberId(place.getId(), member.getId()).get();

        assertThatThrownBy(() -> reviewService.deleteReview(otherMember.getId(), review.getId(), memory.getId(), place.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.REVIEW_NOT_OWNER.getMessage());
    }

    // ===== 헬퍼 메서드 =====

    private CreateUpdateReviewRequestDTO createReviewDto(BigDecimal rating, String content) {
        return new CreateUpdateReviewRequestDTO(place.getId(), memory.getId(), rating, content, LocalDate.of(2026, 5, 2));
    }
}
