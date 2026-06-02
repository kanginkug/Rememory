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

    public void save(PlacePhoto placePhoto) {
        em.persist(placePhoto);
    }

    public List<PlacePhoto> findAllByPlaceId(Long placeId) {

        return em.createQuery("select pp " +
                                  "from PlacePhoto pp " +
                                  "where pp.place.id = :placeId " +
                                        "and pp.deletedAt is null " +
                                  "order by pp.createdAt desc", PlacePhoto.class)
                    .setParameter("placeId", placeId)
                    .getResultList();
    }

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
