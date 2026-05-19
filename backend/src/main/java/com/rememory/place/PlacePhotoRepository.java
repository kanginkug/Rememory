package com.rememory.place;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PlacePhotoRepository {

    @PersistenceContext
    private EntityManager em;

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
}
