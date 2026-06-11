package com.rememory.member;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.memory.MemoryRepository;
import com.rememory.place.PlaceRepository;
import com.rememory.review.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final MemoryRepository memoryRepository;
    private final PlaceRepository placeRepository;
    private final ReviewRepository reviewRepository;

    /**
     * 로그인 정보 조회 및 중복 회원 확인
     */
    public Optional<Member> findByOauthProviderAndOauthId(String oauthProvider, String oauthId){
        return memberRepository.findByOauthProviderAndOauthId(oauthProvider, oauthId);
    }

    @Transactional
    public void join(String name, String email, String profileImageUrl, String oauthProvider, String oauthId) {
        Member newMember = Member.create(name, email, profileImageUrl, oauthProvider, oauthId);
        memberRepository.save(newMember);
    }

    public Optional<Member> findOne(Long id) {
        return memberRepository.findOne(id);
    }

    @Transactional
    public void delete(Long id) {
        Member member = memberRepository.findOne(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        member.delete();
    }

    public MemberStatsResponseDTO getMyStats(Long memberId) {
        int memoryCount = memoryRepository.getMemoryCount(memberId);
        int placeCount = placeRepository.getPlaceCount(memberId);
        BigDecimal reviewAvg = reviewRepository.getReviewAvg(memberId);
        return MemberStatsResponseDTO.from(memoryCount, placeCount, reviewAvg);
    }

    @Transactional
    public void updateMyInfo(Long memberId, UpdateMemberRequestDTO dto) {
        Member member = memberRepository.findOne(memberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        member.updateInfo(dto.getName());
    }

    @Transactional
    public void updateMyProfileImg(Long memberId, UpdateMemberPhotoRequestDTO dto) {
        Member member = memberRepository.findOne(memberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        member.updateProfileImg(dto.getImageUrl());
    }
}
