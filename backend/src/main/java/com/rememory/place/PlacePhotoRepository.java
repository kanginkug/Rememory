package com.rememory.place;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class PlacePhotoRepository {

    @PersistenceContext
    private EntityManager em;
    private final JPAQueryFactory queryFactory;

    /** 장소 사진 저장 */
    public void save(PlacePhoto placePhoto) {
        em.persist(placePhoto);
    }

    /** 장소의 전체 사진 목록 조회 (등록일 최신순, 삭제 제외) */
    public List<PlacePhoto> findAllByPlaceId(Long placeId) {

        return em.createQuery("select pp " +
                                  "from PlacePhoto pp " +
                                  "where pp.place.id = :placeId " +
                                        "and pp.deletedAt is null " +
                                  "order by pp.createdAt desc", PlacePhoto.class)
                    .setParameter("placeId", placeId)
                    .getResultList();
    }

    /** 장소 사진 단건 조회 (삭제된 사진 제외) */
    public Optional<PlacePhoto> findOne(Long placePhotoId) {
        try {
            return Optional.ofNullable(
                    em.createQuery("select pp from PlacePhoto pp where pp.id = :placePhotoId and pp.deletedAt is null", PlacePhoto.class)
                            .setParameter("placePhotoId" ,placePhotoId)
                            .getSingleResult()
            );
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    /** 장소 목록의 대표 사진(최신 1장씩) IN 쿼리 일괄 조회 - N+1 방지, 중복 시 최신 사진 유지 */
    public Map<Long, PlacePhotoResponseDTO> findThumbByPlaceIdList(List<Long> placeIdList) {
        QPlacePhoto pp = QPlacePhoto.placePhoto;

        return queryFactory.select(pp.place.id, pp)
                .from(pp)
                .where(
                        pp.deletedAt.isNull(),
                        pp.place.id.in(placeIdList)
                )
                .orderBy(pp.createdAt.desc())
                .fetch()
                .stream()
                .collect(Collectors.toMap(
                        t -> t.get(pp.place.id),
                        t -> PlacePhotoResponseDTO.from(t.get(pp)),
                        (existing, replacement) -> existing
                ));
    }

    /** 장소의 현재 사진 수 조회 (최대 5장 제한 체크용) */
    public int countByPlaceId(Long placeId) {
         Long photoCount = queryFactory.select(QPlacePhoto.placePhoto.count())
                .from(QPlacePhoto.placePhoto)
                .where(
                        QPlacePhoto.placePhoto.deletedAt.isNull(),
                        QPlacePhoto.placePhoto.place.id.eq(placeId)
                ).fetchOne();
        return photoCount == null ? 0 : photoCount.intValue();
    }
}
