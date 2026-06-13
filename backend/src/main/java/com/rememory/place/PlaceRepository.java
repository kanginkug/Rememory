package com.rememory.place;

import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.rememory.member.QMember;
import com.rememory.memory.QMemberMemory;
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

    /** 장소 저장 */
    public void save(Place place) {
        em.persist(place);
    }

    /** memoryId + placeId로 장소 단건 조회 (삭제된 장소 제외) */
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

    /** 추억 내 전체 장소 목록 조회 (등록일 최신순) */
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
                        regionDepth1 != null && !regionDepth1.isEmpty() ? QPlace.place.regionDepth1.eq(regionDepth1) : null,
                        regionDepth2 != null && !regionDepth2.isEmpty() ? QPlace.place.regionDepth2.eq(regionDepth2) : null
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

    /**
     * 단일 UPDATE 문으로 읽기·계산·쓰기를 원자적으로 처리
     * → SELECT FOR UPDATE 없이도 동시 요청이 직렬화됨 (PostgreSQL row-level lock)
     * 공식: newAvg = (avgRating * reviewCount + newRating) / (reviewCount + 1)
     */
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

    /**
     * 공식: newAvg = (avgRating * reviewCount - oldRating + newRating) / reviewCount
     */
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

    /**
     * reviewCount == 1이면 마지막 리뷰 삭제이므로 0으로 초기화 (0으로 나누기 방지)
     * 공식: newAvg = (avgRating * reviewCount - oldRating) / (reviewCount - 1)
     */
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

    /** 평점 높은 순 베스트 장소 5개 조회 (내 모든 참여 추억 기준) */
    public List<Place> findBestPlace(Long memberId) {
        return queryFactory.selectFrom(QPlace.place)
                .join(QPlace.place.memory, QMemory.memory).fetchJoin()
                .join(QMemberMemory.memberMemory).on(QMemory.memory.id.eq(QMemberMemory.memberMemory.memory.id))
                .where(
                        QMemberMemory.memberMemory.member.id.eq(memberId),
                        QMemberMemory.memberMemory.leftAt.isNull(),
                        QMemory.memory.deletedAt.isNull(),
                        QPlace.place.deletedAt.isNull()
                )
                .orderBy(
                        QPlace.place.avgRating.desc(),
                        QPlace.place.reviewCount.desc()
                )
                .limit(5)
                .fetch();
    }

    /** 내 모든 추억의 전체 장소 목록 조회 (지도 뷰용) */
    public List<Place> findAllPlaceInfo(Long memberId) {
        return queryFactory.selectFrom(QPlace.place)
                .join(QPlace.place.memory, QMemory.memory).fetchJoin()
                .join(QMemberMemory.memberMemory)
                .on(QMemberMemory.memberMemory.memory.id.eq(QMemory.memory.id))
                .where(
                        QMemberMemory.memberMemory.member.id.eq(memberId),
                        QMemberMemory.memberMemory.leftAt.isNull(),
                        QMemory.memory.deletedAt.isNull(),
                        QPlace.place.deletedAt.isNull()
                ).fetch();
    }

    /** 내 등록 장소 수 조회 */
    public int getPlaceCount(Long memberId) {
        Long placeCount = queryFactory.select(QPlace.place.count())
                .from(QPlace.place)
                .join(QMemory.memory)
                .on(QMemory.memory.id.eq(QPlace.place.memory.id))
                .join(QMemberMemory.memberMemory)
                .on(QMemberMemory.memberMemory.memory.id.eq(QPlace.place.memory.id))
                .where(
                        QMemberMemory.memberMemory.member.id.eq(memberId),
                        QMemberMemory.memberMemory.leftAt.isNull(),
                        QMemory.memory.deletedAt.isNull(),
                        QPlace.place.deletedAt.isNull()
                ).fetchOne();

        return placeCount == null ? 0 : placeCount.intValue();
    }
}