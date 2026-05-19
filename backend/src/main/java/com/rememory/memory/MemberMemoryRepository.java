package com.rememory.memory;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class MemberMemoryRepository {

    @PersistenceContext
    private EntityManager em;
    private final JPAQueryFactory queryFactory;

    public void save(MemberMemory memberMemory) {
        em.persist(memberMemory);
    }

    public Optional<MemberMemory> findByMemoryIdAndMemberId(Long memoryId, Long memberId) {
        return Optional.ofNullable(
                queryFactory
                .selectFrom(QMemberMemory.memberMemory)
                .where(
                        QMemberMemory.memberMemory.memory.id.eq(memoryId),
                        QMemberMemory.memberMemory.member.id.eq(memberId),
                        QMemberMemory.memberMemory.leftAt.isNull()
                )
                .fetchOne()
        );
    }

    public List<MemberMemory> findAll(Long memoryId) {
        return queryFactory
                .selectFrom(QMemberMemory.memberMemory)
                .join(QMemory.memory)
                .on(QMemberMemory.memberMemory.memory.id.eq(QMemory.memory.id))
                .where(
                        QMemberMemory.memberMemory.memory.id.eq(memoryId),
                        QMemberMemory.memberMemory.leftAt.isNull()
                )
                .fetch();
    }

    /** 활성 멤버 수 조회 (탈퇴하지 않은 멤버) */
    public int countActiveMembers(Long memoryId) {
        Long count = queryFactory
                .select(QMemberMemory.memberMemory.count())
                .from(QMemberMemory.memberMemory)
                .where(
                        QMemberMemory.memberMemory.memory.id.eq(memoryId),
                        QMemberMemory.memberMemory.leftAt.isNull()
                )
                .fetchOne();
        return count != null ? count.intValue() : 0;
    }
}
