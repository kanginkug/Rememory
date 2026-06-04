package com.rememory.review;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class ReviewPhotoRepository {

    @PersistenceContext
    private EntityManager em;
    private final JPAQueryFactory queryFactory;

    public void save(ReviewPhoto reviewPhoto){
        em.persist(reviewPhoto);
    }

    public List<ReviewPhoto> findByReviewIdAndMemberId(Long reviewId, Long memberId) {
        return queryFactory.selectFrom(QReviewPhoto.reviewPhoto)
                .where(
                        QReviewPhoto.reviewPhoto.deletedAt.isNull(),
                        QReviewPhoto.reviewPhoto.review.id.eq(reviewId),
                        QReviewPhoto.reviewPhoto.member.id.eq(memberId)
                ).fetch();
    }

    public List <ReviewPhoto> findAllByReviewIdList(List<Long> reviewIdList) {
        return queryFactory.selectFrom(QReviewPhoto.reviewPhoto)
                .where(
                        QReviewPhoto.reviewPhoto.deletedAt.isNull(),
                        QReviewPhoto.reviewPhoto.review.id.in(reviewIdList)
                ).fetch();
    }

    public int findCountByReviewId(Long reviewId) {
        Long photoCount =
                queryFactory.select(QReviewPhoto.reviewPhoto.count())
                        .from(QReviewPhoto.reviewPhoto)
                        .where(QReviewPhoto.reviewPhoto.review.id.eq(reviewId),
                                QReviewPhoto.reviewPhoto.deletedAt.isNull())
                        .fetchOne();
        return photoCount == null ? 0 : photoCount.intValue();
    }
}
