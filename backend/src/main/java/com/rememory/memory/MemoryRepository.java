package com.rememory.memory;

import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.rememory.common.commonEnum.SortType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

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
     * @param sortType "DATE_DESC" 최신순 / "DATE_ASC" 오래된순
     *                 "RATING_DESC" 별점높은순 / "RATING_ASC" 별점낮은순
     * @param keyword  키워드로 메모리명 검색
     */
    public List<Memory> findAllByMemberId(Long memberId, SortType sortType, String keyword){
        OrderSpecifier<?> orderSpecifier = switch (sortType) {
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

}
