package com.rememory.place;

import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.rememory.member.QMember;
import com.rememory.memory.QMemory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PlaceRepository {

    @PersistenceContext
    private EntityManager em;
    private final JPAQueryFactory queryFactory;

    public void save(Place place){
        em.persist(place);
    }

    public Optional<Place> findOne(Long memoryId, Long placeId) {
        try {
            return Optional.ofNullable(
                    queryFactory.selectFrom(QPlace.place)
                            .where(
                                    QPlace.place.deletedAt.isNull(),
                                    QPlace.place.memory.id.eq(memoryId),
                                    QPlace.place.id.eq(placeId)
                            )
                            .fetchOne()
            );
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    public List<Place> findAllByMemoryId(Long memoryId) {
            return queryFactory.selectFrom(QPlace.place)
                    .where(
                            QPlace.place.deletedAt.isNull(),
                            QPlace.place.memory.id.eq(memoryId)
                    )
                    .orderBy(QPlace.place.createdAt.desc())
                    .fetch();
    }

    //카테고리, 지역 별 조회
    public List<Place> findAllByCategoryAndRegion(Long memoryId, Category category, String regionDepth1, String regionDepth2) {

            return queryFactory.selectFrom(QPlace.place)
                    .where(
                            QPlace.place.memory.id.eq(memoryId),
                            QPlace.place.deletedAt.isNull(),
                            category != null ? QPlace.place.category.eq(category) : null,
                            regionDepth1 != null ? QPlace.place.region_depth1.eq(regionDepth1) : null,
                            regionDepth2 != null ? QPlace.place.region_depth2.eq(regionDepth2) : null
                    )
                    .orderBy(QPlace.place.createdAt.desc())
                    .fetch();
    }

    //장소명 검색
    public List<Place> findByName(String name, Long memoryId) {
            return queryFactory.selectFrom(QPlace.place)
                  .where(
                          QPlace.place.deletedAt.isNull(),
                          QPlace.place.name.containsIgnoreCase(name),
                          QPlace.place.memory.id.eq(memoryId)
                  )
                  .fetch();
    }

    // 리뷰 추가 시 별점 평균 계산
    public void updateRatingOnCreate(Long placeId, BigDecimal newRating) {
        queryFactory.update(QPlace.place)
                .set(QPlace.place.avgRating,
                        QPlace.place.avgRating
                                .multiply(QPlace.place.reviewCount)
                                .add(newRating)
                                .divide(QPlace.place.reviewCount.add(1)))
                .set(QPlace.place.reviewCount, QPlace.place.reviewCount.add(1))
                .where(QPlace.place.id.eq(placeId))
                .execute();
    }

    // 리뷰 수정 시 별점 평균 계산
    public void updateRatingOnUpdate(Long placeId, BigDecimal newRating, BigDecimal oldRating) {
        queryFactory.update(QPlace.place)
                .set(QPlace.place.avgRating,
                        QPlace.place.avgRating
                                .multiply(QPlace.place.reviewCount)
                                .subtract(oldRating)
                                .add(newRating)
                                .divide(QPlace.place.reviewCount))
                .where(QPlace.place.id.eq(placeId))
                .execute();
    }

    // 리뷰 삭제 시 별점 평균 계산
    public void updateRatingOnDelete(Long placeId, BigDecimal oldRating) {
        queryFactory.update(QPlace.place)
                .set(QPlace.place.avgRating,
                        Expressions.cases()
                                .when(QPlace.place.reviewCount.eq(1))
                                .then(BigDecimal.ZERO)
                                .otherwise(
                                        QPlace.place.avgRating
                                                .multiply(QPlace.place.reviewCount)
                                                .subtract(oldRating)
                                                .divide(QPlace.place.reviewCount.subtract(1))
                                )
                )
                .set(QPlace.place.reviewCount, QPlace.place.reviewCount.subtract(1))
                .where(QPlace.place.id.eq(placeId))
                .execute();
    }
}
