package com.rememory.memory;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.common.s3.service.UploadService;
import com.rememory.invitation.InvitationService;
import com.rememory.member.Member;
import com.rememory.member.MemberInfoDTO;
import com.rememory.member.MemberRepository;
import com.rememory.memory.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MemoryService {
    private final MemoryRepository memoryRepository;
    private final MemberRepository memberRepository;
    private final MemoryPhotoRepository mpRepository;
    private final MemberMemoryRepository mmRepository;
    private final InvitationService invitationService;
    private final UploadService uploadService;

    @Transactional
    public void createMemory(Long creatorId, CreateMemoryRequestDTO memory) {
        Member creator = memberRepository.findOne(creatorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        Memory createMemory = Memory.create(creator, memory.getMemoryName(), memory.getDescription(), memory.getStartDate(), memory.getEndDate());
        memoryRepository.save(createMemory);

        MemberMemory createMemberMemory = MemberMemory.create(creator, createMemory);
        mmRepository.save(createMemberMemory);

        if(memory.getPhotoUrl() != null && !memory.getPhotoUrl().isEmpty()){
            MemoryPhoto memoryPhoto = MemoryPhoto.create(createMemory, creator, memory.getPhotoUrl());
            mpRepository.save(memoryPhoto);
        }

        if (memory.getInvitedCnt() > 0) {
            invitationService.save(createMemory.getId(), creatorId);
        }
    }

    @Transactional
    public void updateMemory(Long memberId, Long memoryId, UpdateMemoryRequestDTO memory) {
        Member updater = memberRepository.findOne(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory updateMemory = memoryRepository.findOne(memoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if (!updater.getId().equals(updateMemory.getCreator().getId())) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_CREATOR);
        }
        updateMemory.update(memory.getMemoryName(), memory.getShowHistoryToNew(), memory.getDescription(), memory.getStartDate(), memory.getEndDate());
    }

    @Transactional
    public void deleteMemory(Long memoryId, Long memberId) {
        if(memberRepository.findOne(memberId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        Memory deleteMemory = memoryRepository.findOne(memoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if(!deleteMemory.getCreator().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_CREATOR);
        }

        if(deleteMemory.getPlaceCount() > 0) {
            throw new BusinessException(ErrorCode.MEMORY_HAS_PLACES);
        }

        deleteMemory.delete();

    }

    public List<MemoryListResponseDTO> findMemoryList(Long memberId, SortTypeMemory sortTypeMemory, String keyword) {

        List<Memory> memoryList = memoryRepository.findAllByMemberId(memberId, sortTypeMemory, keyword);
        List<MemoryListResponseDTO> mDResponseDTOList = new ArrayList<>();
        for(Memory memory : memoryList) {
            String imageUrl = mpRepository.findOne(memory.getId())  // Optional<MemoryPhoto> 반환
                    .map(MemoryPhoto::getImageUrl)     // MemoryPhoto가 있으면 imageUrl로 변환 → Optional<String>
                    .orElse(null);
            mDResponseDTOList.add(MemoryListResponseDTO.from(memory, imageUrl));
        }
        return mDResponseDTOList;
    }

    /** 해당 메모리에 해당 회원이 존재하는지 체크 */
    public MemberMemory findMemberMemory (Long memoryId, Long memberId) {
        return mmRepository.findActiveByMemoryIdAndMemberId(memoryId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND));
    }

    public MemoryDetailResponseDTO findMemory(Long memberId, Long memoryId){
        if(memberRepository.findOne(memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }
        if(mmRepository.findActiveByMemoryIdAndMemberId(memoryId, memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }
        Memory memory = memoryRepository.findOne(memoryId).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));
        String imageUrl = mpRepository.findOne(memory.getId())  // Optional<MemoryPhoto> 반환
                .map(MemoryPhoto::getImageUrl)     // MemoryPhoto가 있으면 imageUrl로 변환 → Optional<String>
                .orElse(null);
        List<MemberInfoDTO> members = mmRepository.findActiveByMemoryId(memoryId)
                .stream()
                .map(mm -> MemberInfoDTO.from(mm.getMember().getId(), mm.getMember().getName(), mm.getMember().getProfileImageUrl()))
                .toList();
        return MemoryDetailResponseDTO.from(memory, imageUrl, members);
    }

    /**
     * 추억 나가기
     * - leftAt 세팅
     * - 마지막 멤버가 나가면 Memory 자동 softDelete (고아 추억 방지)
     */
    @Transactional
    public void leftMemory(Long memoryId, Long memberId) {
        MemberMemory memberMemory = mmRepository.findActiveByMemoryIdAndMemberId(memoryId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND));

        memberMemory.leftMemory();

        int remainCount = mmRepository.countActiveMembers(memoryId);
        Memory memory = memoryRepository.findOne(memoryId).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));
        memory.minusMemberCount();
        if (remainCount == 0) {
            memory.delete();
        }
    }

    /** 추억 표지 사진 저장 */
    @Transactional
    public void saveMemoryPhoto(MemoryPhotoRequestDTO memoryPhotoRequestDTO, Long memoryId, Long creatorId) {
        Member creator = memberRepository.findOne(creatorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory memory = memoryRepository.findOne(memoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if (mmRepository.findActiveByMemoryIdAndMemberId(memoryId, creatorId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }
        Optional<MemoryPhoto> existing = mpRepository.findOne(memoryId);
        if (existing.isPresent()) {
            uploadService.delete(existing.get().getImageUrl());
            existing.get().delete();
        }

        MemoryPhoto newPhoto = MemoryPhoto.create(memory, creator, memoryPhotoRequestDTO.getImageUrl());
        mpRepository.save(newPhoto);
    }

    /** 추억 표지 사진 삭제 */
    @Transactional
    public void deleteMemoryPhoto(Long memoryId, Long deleterId) {
        if (memberRepository.findOne(deleterId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }
        if (memoryRepository.findOne(memoryId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_FOUND);
        }
        if (mmRepository.findActiveByMemoryIdAndMemberId(memoryId, deleterId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        MemoryPhoto memoryPhoto = mpRepository.findOne(memoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_PHOTO_NOT_FOUND));
        uploadService.delete(memoryPhoto.getImageUrl());
        memoryPhoto.delete();
    }


}
