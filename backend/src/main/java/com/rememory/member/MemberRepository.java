package com.rememory.member;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class MemberRepository {

    @PersistenceContext
    private EntityManager em;

    public void save(Member member) {
        em.persist(member);
    }

    public Optional<Member> findOne(Long id) {
        return Optional.ofNullable(em.find(Member.class, id));
    }

    //로그인 정보 조회 및 중복 회원가입 조회
    public Optional<Member> findByOauthProviderAndOauthId(String oauthProvider, String oauthId) {
        try{
            Member member = em.createQuery("select m from Member m where m.oauthProvider = :oauthProvider and m.oauthId = :oauthId", Member.class)
                    .setParameter("oauthId", oauthId)
                    .setParameter("oauthProvider", oauthProvider)
                    .getSingleResult();
            return Optional.of(member);
        } catch (NoResultException e){
            return Optional.empty();
        }
    }
}
