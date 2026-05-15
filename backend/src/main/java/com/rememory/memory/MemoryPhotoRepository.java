package com.rememory.memory;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 추억 표지 사진 레포지토리
 */
@Repository
@RequiredArgsConstructor
public class MemoryPhotoRepository {

    @PersistenceContext
    private final EntityManager em;

    public void save(MemoryPhoto memoryPhoto) {
        em.persist(memoryPhoto);
    }

    /**
     * 추억 ID로 현재 사진 조회 (삭제 안 된 것만)
     */
    public Optional<MemoryPhoto> findOne(Long memoryId) {
        List<MemoryPhoto> result = em.createQuery(
                "select mp from MemoryPhoto mp where mp.memory.id = :memoryId and mp.deletedAt is null",
                MemoryPhoto.class)
                .setParameter("memoryId", memoryId)
                .getResultList();
        return result.stream().findFirst();
    }
}
