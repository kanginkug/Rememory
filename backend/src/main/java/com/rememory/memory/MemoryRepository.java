package com.rememory.memory;

import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.rememory.place.QPlace;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class MemoryRepository {

    @PersistenceContext
    private EntityManager em;
    private final JPAQueryFactory queryFactory;

    public void save(Memory memory) {

        em.persist(memory);
    }

    /**
     * 메모리 목록 조회
     * @param sortTypeMemory "DATE_DESC" 최신순 / "DATE_ASC" 오래된순
     *                 "RATING_DESC" 별점높은순 / "RATING_ASC" 별점낮은순
     * @param keyword  키워드로 메모리명 검색
     */
    public List<Memory> findAllByMemberId(Long memberId, SortTypeMemory sortTypeMemory, String keyword){
        OrderSpecifier<?> orderSpecifier = switch (sortTypeMemory) {
            case DATE_ASC -> QMemory.memory.createdAt.asc();
            case DATE_DESC -> QMemory.memory.createdAt.desc();
            case RATING_ASC -> QMemory.memory.avgRating.asc();
            case RATING_DESC -> QMemory.memory.avgRating.desc();
        };

        return queryFactory
                .selectFrom(QMemory.memory)
                .join(QMemberMemory.memberMemory)
                .on(
                        QMemberMemory.memberMemory.memory.id.eq(QMemory.memory.id)
                )
                .leftJoin(QMemoryPhoto.memoryPhoto).on(QMemoryPhoto.memoryPhoto.memory.id.eq(QMemory.memory.id)).fetchJoin()
                .where(
                        QMemberMemory.memberMemory.member.id.eq(memberId),
                        QMemberMemory.memberMemory.leftAt.isNull(),
                        QMemory.memory.deletedAt.isNull(),
                        keyword != null ? QMemory.memory.name.containsIgnoreCase(keyword) : null
                )
                .orderBy(orderSpecifier, QMemory.memory.id.desc())
                .fetch();
    }

    public Optional<Memory> findOne(Long memoryId) {
        return Optional.ofNullable(em.find(Memory.class, memoryId));
    }

    /** 삭제되지 않은 전체 Place의 avgRating 평균을 Memory에 반영 — Review 변동 시마다 호출 */
    public void recalculateRating(Long memoryId) {
        Double avg = queryFactory.select(QPlace.place.avgRating.avg())
                .from(QPlace.place)
                .where(
                        QPlace.place.memory.id.eq(memoryId),
                        QPlace.place.deletedAt.isNull()
                )
                .fetchOne();

        // 리뷰가 하나도 없는 경우(avg == null) 0으로 초기화
        queryFactory.update(QMemory.memory)
                .set(QMemory.memory.avgRating, avg != null ? BigDecimal.valueOf(avg) : BigDecimal.ZERO)
                .where(QMemory.memory.id.eq(memoryId))
                .execute();
    }

    /** delta: 장소 추가 시 +1, 삭제 시 -1 */
    public void updatePlaceCount(Long memoryId, int delta) {
        queryFactory.update(QMemory.memory)
                .set(QMemory.memory.placeCount, QMemory.memory.placeCount.add(delta))
                .where(QMemory.memory.id.eq(memoryId))
                .execute();
    }

    public int getMemoryCount(Long memberId) {
        Long memoryCount = queryFactory.select(QMemory.memory.count())
                .from(QMemory.memory)
                .join(QMemberMemory.memberMemory)
                .on(
                        QMemory.memory.id.eq(QMemberMemory.memberMemory.memory.id)
                )
                .where(
                        QMemberMemory.memberMemory.member.id.eq(memberId),
                        QMemberMemory.memberMemory.leftAt.isNull(),
                        QMemory.memory.deletedAt.isNull()
                ).fetchOne();
        return memoryCount == null ? 0 : memoryCount.intValue();
    }

}
