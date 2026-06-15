package com.rememory.review;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ReviewPhotoRepository {

    @PersistenceContext
    private EntityManager em;
    private final JPAQueryFactory queryFactory;

    /** 리뷰 사진 저장 */
    public void save(ReviewPhoto reviewPhoto){
        em.persist(reviewPhoto);
    }

    /** 특정 후기의 내 사진 목록 조회 (삭제 제외) */
    public List<ReviewPhoto> findByReviewIdAndMemberId(Long reviewId, Long memberId) {
        return queryFactory.selectFrom(QReviewPhoto.reviewPhoto)
                .where(
                        QReviewPhoto.reviewPhoto.deletedAt.isNull(),
                        QReviewPhoto.reviewPhoto.review.id.eq(reviewId),
                        QReviewPhoto.reviewPhoto.member.id.eq(memberId)
                ).fetch();
    }

    /** 후기 ID 목록으로 사진 일괄 조회 - N+1 방지 */
    public List <ReviewPhoto> findAllByReviewIdList(List<Long> reviewIdList) {
        return queryFactory.selectFrom(QReviewPhoto.reviewPhoto)
                .where(
                        QReviewPhoto.reviewPhoto.deletedAt.isNull(),
                        QReviewPhoto.reviewPhoto.review.id.in(reviewIdList)
                ).fetch();
    }

    /** 특정 후기의 사진 수 조회 (최대 3장 제한 체크용) */
    public int findCountByReviewId(Long reviewId) {
        Long photoCount =
                queryFactory.select(QReviewPhoto.reviewPhoto.count())
                        .from(QReviewPhoto.reviewPhoto)
                        .where(QReviewPhoto.reviewPhoto.review.id.eq(reviewId),
                                QReviewPhoto.reviewPhoto.deletedAt.isNull())
                        .fetchOne();
        return photoCount == null ? 0 : photoCount.intValue();
    }

    /** 리뷰 사진 단건 조회 (삭제 제외) */
    public Optional<ReviewPhoto> findOne(Long reviewPhotoId) {
        try {
            return Optional.ofNullable(
                    queryFactory.selectFrom(QReviewPhoto.reviewPhoto)
                            .where(
                                    QReviewPhoto.reviewPhoto.deletedAt.isNull(),
                                    QReviewPhoto.reviewPhoto.id.eq(reviewPhotoId)
                            ).fetchOne()
            );
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }
}
