package com.rememory.invitation;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class InvitationRepository {

    @PersistenceContext
    private EntityManager em;

    public void save(Invitation invitation) {
        em.persist(invitation);
    }

    public Optional<Invitation> findOneByInviteCode(String inviteCode) {
        try {
            return Optional.ofNullable(em.createQuery("select i from Invitation i where i.inviteCode = :inviteCode", Invitation.class)
                    .setParameter("inviteCode", inviteCode)
                    .getSingleResult());
        } catch (NoResultException e) {
            return Optional.empty();
        }

    }
}
