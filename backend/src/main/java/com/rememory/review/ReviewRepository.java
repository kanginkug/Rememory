package com.rememory.review;

import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.rememory.member.QMember;
import com.rememory.memory.QMemberMemory;
import com.rememory.memory.QMemory;
import com.rememory.memory.SortTypeMemory;
import com.rememory.place.QPlace;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ReviewRepository {

    @PersistenceContext
    private EntityManager em;
    private final JPAQueryFactory queryFactory;

    public void save(Review review) {
        em.persist(review);
    }

    public Optional<Review> findOne(Long reviewId) {
        try {
            return Optional.ofNullable(
                    em.createQuery("select r from Review r where r.id = :reviewId and r.deletedAt is null", Review.class)
                            .setParameter("reviewId", reviewId)
                            .getSingleResult()
            );
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    public List<Review> findAllByPlaceId(Long placeId) {
            return queryFactory.selectFrom(QReview.review)
                            .join(QReview.review.member, QMember.member).fetchJoin()
                            .join(QReview.review.place, QPlace.place).fetchJoin()
                            .join(QPlace.place.memory, QMemory.memory).fetchJoin()
                            .where(
                                    QReview.review.place.id.eq(placeId),
                                    QReview.review.deletedAt.isNull(),
                                    QPlace.place.deletedAt.isNull(),
                                    QMemory.memory.deletedAt.isNull()
                            ).fetch();
    }

    /**
     * 메모리 목록 조회
     * @param sortTypeReview "DATE_DESC" 최신순 / "DATE_ASC" 오래된순
     *                 "RATING_DESC" 별점높은순 / "RATING_ASC" 별점낮은순
*                      "VISITED_DESC" 방문일 최신순 / "VISITED_ASC" 방문일 오래된순
     * @param placeId  장소ID
     */
    public List<Review> sortByType(Long placeId, SortTypeReview sortTypeReview) {
        OrderSpecifier<?> orderSpecifier = switch (sortTypeReview) {
            case DATE_ASC -> QReview.review.createdAt.asc();
            case DATE_DESC -> QReview.review.createdAt.desc();
            case RATING_ASC -> QReview.review.rating.asc();
            case RATING_DESC -> QReview.review.rating.desc();
            case VISITED_ASC -> QReview.review.visitedAt.asc();
            case VISITED_DESC -> QReview.review.visitedAt.desc();
        };

        return queryFactory.selectFrom(QReview.review)
                .join(QReview.review.member, QMember.member).fetchJoin()
                .join(QReview.review.place, QPlace.place).fetchJoin()
                .join(QPlace.place.memory, QMemory.memory).fetchJoin()
                .where(
                        QReview.review.place.id.eq(placeId),
                        QReview.review.deletedAt.isNull(),
                        QPlace.place.deletedAt.isNull(),
                        QMemory.memory.deletedAt.isNull()
                )
                .orderBy(orderSpecifier, QReview.review.id.desc())
                .fetch();
    }

    // 내가 쓴 리뷰 조회 및 1인 1후기 중복 체크
    public Optional<Review> findByPlaceIdAndMemberId(Long PlaceId, Long memberId) {
        try {
            return Optional.ofNullable(
                    queryFactory.selectFrom(QReview.review)
                            .join(QPlace.place)
                            .on(QReview.review.place.id.eq(QPlace.place.id))
                            .join(QMember.member)
                            .on(QReview.review.member.id.eq(QMember.member.id))
                            .where(
                                    QReview.review.place.id.eq(PlaceId),
                                    QReview.review.member.id.eq(memberId),
                                    QReview.review.deletedAt.isNull()
                            )
                            .fetchOne()
            );
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    public List<Review> findRecentReview(Long memberId) {
        return queryFactory.selectFrom(QReview.review)
                .join(QReview.review.member, QMember.member).fetchJoin()
                .join(QReview.review.place, QPlace.place).fetchJoin()
                .join(QPlace.place.memory, QMemory.memory).fetchJoin()
                .join(QMemberMemory.memberMemory).on(QMemberMemory.memberMemory.memory.id.eq(QMemory.memory.id))
                .where(
                        QMemberMemory.memberMemory.member.id.eq(memberId),
                        QMemberMemory.memberMemory.leftAt.isNull(),
                        QMemory.memory.deletedAt.isNull(),
                        QPlace.place.deletedAt.isNull(),
                        QReview.review.deletedAt.isNull()
                )
                .orderBy(QReview.review.createdAt.desc())
                .limit(10)
                .fetch();
    }

    public List<Review> findAllMyReview(Long memberId) {
        return queryFactory.selectFrom(QReview.review)
                .join(QReview.review.member, QMember.member).fetchJoin()
                .join(QReview.review.place, QPlace.place).fetchJoin()
                .join(QPlace.place.memory, QMemory.memory).fetchJoin()
                .join(QMemberMemory.memberMemory).on(QMemberMemory.memberMemory.memory.id.eq(QMemory.memory.id))
                .where(
                        QMemberMemory.memberMemory.member.id.eq(memberId),
                        QReview.review.member.id.eq(memberId),
                        QMemberMemory.memberMemory.leftAt.isNull(),
                        QMemory.memory.deletedAt.isNull(),
                        QPlace.place.deletedAt.isNull(),
                        QReview.review.deletedAt.isNull()
                )
                .orderBy(QReview.review.createdAt.desc())
                .fetch();
    }

    public BigDecimal getReviewAvg(Long memberId) {
        Double reviewAvg =  queryFactory.select(QReview.review.rating.avg())
                .from(QReview.review)
                .where(
                        QReview.review.member.id.eq(memberId),
                        QReview.review.deletedAt.isNull()
                ).fetchOne();
        return reviewAvg == null ? BigDecimal.valueOf(0.0) : BigDecimal.valueOf(reviewAvg).setScale(1, RoundingMode.HALF_UP);
    }
}
